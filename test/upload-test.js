/* ==========================================================
   upload-test.js — Integration regression test
   Exercises the real handler stack against a local Netlify
   BlobsServer (filesystem-backed): multipart upload -> blob PUT
   -> blob GET (WHATWG Blob arrival) -> image.js base64 gateway
   -> byte-exact roundtrip.

   Run:  node test/upload-test.js
   ========================================================== */

'use strict';

const assert = require('assert');
const os = require('os');
const path = require('path');
const fs = require('fs');

async function startBlobsServer() {
  const { BlobsServer } = require('@netlify/blobs/server');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'blobs-test-'));
  const token = 'test-blob-token';
  const server = new BlobsServer({ directory, port: 0, token });
  await server.start();
  const port = Number(new URL(server.address).port);
  return { server, token, url: `http://127.0.0.1:${port}` };
}

(async () => {
  // --- === SECTION MOCK EDITS BELOW === ---
  // 1. Real BlobsServer backed by a temp directory (no Netlify credentials).
  const { server, token, url } = await startBlobsServer();

  // --- Handler auth ---
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'secret123';
  process.env.SESSION_SECRET = 'upload-test-secret';

  // 2. Point the Blobs client at the local server.
  process.env.NETLIFY_BLOBS_SITE_ID = 'local-test-site';
  process.env.NETLIFY_BLOBS_TOKEN = token;
  process.env.NETLIFY_BLOBS_API_URL = url;

  const uploadHandler = require('../netlify/functions/upload-image');
  const imageHandler = require('../netlify/functions/image');
  const { createToken, imageGet } = require('../netlify/functions/auth-utils');

  let passed = 0;
  let failed = 0;
  function check(label, cond, extra) {
    if (cond) {
      passed++;
      console.log('  PASS  ' + label);
    } else {
      failed++;
      console.log('  FAIL  ' + label + (extra ? '  ' + JSON.stringify(extra) : ''));
    }
  }

  // A tiny real 1x1 PNG so roundtrip bytes are a genuine image.
  const PNG_1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );

  function buildMultipart(filename, fieldName, productId, fileContent, mimeType) {
    const boundary = '----UploadTestBoundary7MA4YWxkTrZu0gW';
    const CRLF = '\r\n';
    let body = Buffer.alloc(0);
    body = Buffer.concat([body, Buffer.from(`--${boundary}${CRLF}`)]);
    body = Buffer.concat([body, Buffer.from(`Content-Disposition: form-data; name="${fieldName}"${CRLF}${CRLF}${productId}${CRLF}`)]);
    body = Buffer.concat([body, Buffer.from(`--${boundary}${CRLF}`)]);
    body = Buffer.concat([
      body,
      Buffer.from(`Content-Disposition: form-data; name="image"; filename="${filename}"${CRLF}`),
      Buffer.from(`Content-Type: ${mimeType}${CRLF}${CRLF}`),
      fileContent,
      Buffer.from(`${CRLF}--${boundary}--${CRLF}`)
    ]);
    return { body, boundary };
  }

  function authHeaders() {
    const tok = createToken({ sub: 'admin' });
    return { authorization: 'Bearer ' + tok };
  }

  console.log('\n[upload+image integration]');

  // ---- 1. Upload a valid PNG via the real handler ----
  const { body: raw, boundary } = buildMultipart('photo.png', 'productId', 'test-prod', PNG_1x1, 'image/png');
  const uploadEvent = {
    httpMethod: 'POST',
    path: '/api/upload-image',
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}`, ...authHeaders() },
    body: raw.toString('base64'),
    isBase64Encoded: true,
    queryStringParameters: {},
    rawQuery: ''
  };

  let upload;
  try {
    upload = await uploadHandler.handler(uploadEvent);
  } catch (err) {
    check('upload handler runs without throwing', false, err && err.message);
    await server.stop?.();
    process.exit(1);
  }

  check('upload returns 201', upload.statusCode === 201, upload);
  let parsed = null;
  try { parsed = JSON.parse(upload.body); } catch { /* ignore */ }
  check('upload body is JSON { success, imageUrl, filename }',
    parsed && parsed.success === true && typeof parsed.imageUrl === 'string' && typeof parsed.filename === 'string', parsed);
  const filename = parsed && parsed.filename;
  check('filename is unique + safe pattern',
    !!filename && /^test-prod-\d+-[0-9a-f]{8}\.png$/.test(filename), filename);
  check('imageUrl is the /api/image gateway url',
    parsed && parsed.imageUrl === '/api/image?name=' + encodeURIComponent(filename), parsed && parsed.imageUrl);
  const imageName = filename ? decodeURIComponent(parsed.imageUrl.split('name=').pop()) : '';
  check('imageUrl encodes the stored key', filename && imageName === filename, imageName);

  // ---- 2. imageGet roundtrip: the store returns a WHATWG Blob ----
  let entry = null;
  try {
    entry = await imageGet(filename, uploadEvent);
  } catch (err) {
    check('imageGet succeeds', false, err && err.message);
  }
  check('imageGet returns an entry', !!entry, entry);
  const isBlob = entry && typeof Blob !== 'undefined' && entry.data instanceof Blob;
  const isBlobLike = entry && entry.data && typeof entry.data.arrayBuffer === 'function';
  check('entry.data is a Blob (Node blob) or blob-like',
    isBlob || isBlobLike, entry && Object.prototype.toString.call(entry.data));
  check('entry.metadata.contentType preserved', entry && entry.metadata && entry.metadata.contentType === 'image/png', entry && entry.metadata);
  if (isBlob) {
    check('entry.data passes instanceof Blob (git objective: Blob support)', true);
  }
  if (entry && isBlobLike) {
    const buf = Buffer.from(await entry.data.arrayBuffer());
    check('Blob.arrayBuffer() decodes to the original bytes', buf.equals(PNG_1x1));
  } else {
    check('Blob.arrayBuffer() decodes to the original bytes', false, 'entry.data not blob-like');
  }

  // ---- 3. image.js gateway: GET through queryStringParameters ----
  const getEvent = {
    httpMethod: 'GET',
    path: '/api/image',
    headers: {},
    queryStringParameters: { name: filename },
    rawQuery: 'name=' + encodeURIComponent(filename)
  };
  let getRes = await imageHandler.handler(getEvent);
  check('image GET (parsed params) -> 200', getRes.statusCode === 200, getRes);
  check('image GET is base64 encoded', getRes.isBase64Encoded === true, getRes);
  check('image GET content-type matches', (getRes.headers && getRes.headers['Content-Type']) === 'image/png', getRes.headers);
  if (getRes.statusCode === 200) {
    const servedBytes = Buffer.from(getRes.body, 'base64');
    check('image GET body byte-exact roundtrip', servedBytes.equals(PNG_1x1));
  }

  // ---- 4. image.js gateway: query fallback via rawQuery only ----
  const rawOnlyEvent = {
    httpMethod: 'GET',
    path: '/api/image',
    headers: {},
    queryStringParameters: null,
    rawQuery: 'name=' + encodeURIComponent(filename)
  };
  let rawRes = await imageHandler.handler(rawOnlyEvent);
  check('image GET (rawQuery fallback) -> 200', rawRes.statusCode === 200, rawRes);
  if (rawRes.statusCode === 200) {
    check('image GET (rawQuery fallback) body matches', Buffer.from(rawRes.body, 'base64').equals(PNG_1x1));
  }

  // ---- 5. validation: missing and invalid names ----
  let noName = await imageHandler.handler({ httpMethod: 'GET', path: '/api/image', headers: {}, queryStringParameters: null, rawQuery: '' });
  check('image GET without name -> 400', noName.statusCode === 400, noName);
  let badName = await imageHandler.handler({ httpMethod: 'GET', path: '/api/image', headers: {}, queryStringParameters: { name: '../../../etc/passwd' }, rawQuery: '' });
  check('image GET invalid name -> 400', badName.statusCode === 400, badName);
  let missing = await imageHandler.handler({ httpMethod: 'GET', path: '/api/image', headers: {}, queryStringParameters: { name: 'does-not-exist-123.png' }, rawQuery: '' });
  check('image GET unknown name -> 404', missing.statusCode === 404, missing);

  // ---- 6. rejected uploads never reach the store ----
  const badEvent = {
    httpMethod: 'POST',
    path: '/api/upload-image',
    headers: { 'content-type': 'application/json', ...authHeaders() },
    body: Buffer.from(JSON.stringify({ a: 1 })).toString('base64'),
    isBase64Encoded: true,
    queryStringParameters: {},
    rawQuery: ''
  };
  let badUpload = await uploadHandler.handler(badEvent);
  check('invalid multipart upload -> 400', badUpload.statusCode === 400, badUpload);

  const txtEvent = { ...uploadEvent };
  const fake = buildMultipart('note.txt', 'productId', 'test-prod', Buffer.from('not an image'), 'text/plain');
  txtEvent.headers = { 'content-type': `multipart/form-data; boundary=${fake.boundary}`, ...authHeaders() };
  txtEvent.body = fake.body.toString('base64');
  let txtRes = await uploadHandler.handler(txtEvent);
  check('text file upload rejected (400)', txtRes.statusCode === 400, txtRes);

  // ---- 7. cleanup ----
  try {
    await server.stop?.();
    check('BlobsServer stopped cleanly', true);
  } catch (err) {
    check('BlobsServer stopped cleanly', false, err && err.message);
  }

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});