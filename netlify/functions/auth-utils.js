/* ==========================================================
   auth-utils.js — Shared auth + storage helpers for the
   AL SULTAN catalog admin.

   This version is fully self-contained (no GitHub, no Netlify
   environment variables). Login credentials are embedded here
   so the control panel works with a simple file upload to
   Netlify. Product catalog + images are stored in Netlify Blobs.
   ========================================================== */

'use strict';

const crypto = require('crypto');

/* ----------------------------------------------------------
   EMBEDDED ADMIN CREDENTIALS
   Change these to your preferred username / password.
   NOTE: Because this runs in a static upload (no env vars),
   the credentials live in this file. Anyone with access to the
   deployed files can read them — that's the trade-off of the
   "upload and go" setup.
   ---------------------------------------------------------- */
const ADMIN_USER = 'Administrator';
const ADMIN_PASS = 'Admin123456789';

// Used to sign login tokens. A long fixed string is fine here
// since there is no environment-variable secret to draw from.
const SESSION_SECRET = 'al-sultan-catalog-embedded-session-secret-8f3a1c';

const TOKEN_EXPIRY_MS = 8 * 60 * 60 * 1000; // 8 hours

/* --- Blob store names --- */
const CATALOG_STORE = 'catalog';
const CATALOG_KEY = 'products';
const IMAGES_STORE = 'images';

/* --- Netlify Blobs access ---
   Prefer the runtime-built-in `netlify:blobs` (no npm install,
   ideal for drag-and-drop deploys). Fall back to a vendored
   `@netlify/blobs` package in node_modules if present. */
let blobsModule = null;

function loadBlobs() {
  if (blobsModule) return blobsModule;
  try {
    // eslint-disable-next-line global-require
    blobsModule = require('netlify:blobs');
  } catch {
    try {
      // eslint-disable-next-line global-require
      blobsModule = require('@netlify/blobs');
    } catch {
      blobsModule = null;
    }
  }
  return blobsModule;
}

function hasBlobs() {
  return !!loadBlobs();
}

function getStore(name) {
  const blobs = loadBlobs();
  // Pass the auto-injected Netlify Blobs credentials explicitly. On the
  // standard runtime these are provided to every function; being explicit
  // avoids relying on SDK auto-detection.
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  if (siteID && token) {
    return blobs.getStore({ name, siteID, token });
  }
  if (siteID) {
    return blobs.getStore({ name, siteID });
  }
  return blobs.getStore(name);
}

/* --- Catalog read/write helpers --- */
async function catalogGetDefault() {
  // If the blob store is empty, return null so callers can seed
  // from the bundled data/products.json.
  try {
    const store = getStore(CATALOG_STORE);
    return await store.get(CATALOG_KEY, { type: 'json', consistency: 'strong' });
  } catch (err) {
    if (!hasBlobs()) throw { statusCode: 500, body: JSON.stringify({ error: 'Blobs unavailable', message: 'Netlify Blobs runtime not available on this deploy' }) };
    throw err;
  }
}

async function catalogSave(catalog) {
  try {
    const store = getStore(CATALOG_STORE);
    await store.setJSON(CATALOG_KEY, catalog);
    return catalog;
  } catch (err) {
    if (!hasBlobs()) throw { statusCode: 500, body: JSON.stringify({ error: 'Blobs unavailable', message: 'Netlify Blobs runtime not available on this deploy' }) };
    throw err;
  }
}

/* --- Image write/read helpers --- */
async function imagePut(key, data, contentType) {
  try {
    const store = getStore(IMAGES_STORE);
    await store.set(key, Buffer.from(data), { metadata: { contentType } });
  } catch (err) {
    if (!hasBlobs()) throw { statusCode: 500, body: JSON.stringify({ error: 'Blobs unavailable', message: 'Netlify Blobs runtime not available on this deploy' }) };
    throw err;
  }
}

async function imageGet(key) {
  try {
    const store = getStore(IMAGES_STORE);
    const entry = await store.getWithMetadata(key, { type: 'blob', consistency: 'strong' });
    if (!entry) return null;
    return { data: entry.data, metadata: entry.metadata || {} };
  } catch (err) {
    if (!hasBlobs()) throw { statusCode: 500, body: JSON.stringify({ error: 'Blobs unavailable', message: 'Netlify Blobs runtime not available on this deploy' }) };
    throw err;
  }
}

/* ----------------------------------------------------------
   SESSION / AUTH
   ---------------------------------------------------------- */

function getSessionSecret() {
  return SESSION_SECRET;
}

function validateCredentials(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') return false;

  const a = Buffer.from(String(username));
  const b = Buffer.from(String(ADMIN_USER));
  const c = Buffer.from(String(password));
  const d = Buffer.from(String(ADMIN_PASS));

  const userOk = a.length === b.length && crypto.timingSafeEqual(a, b);
  const passOk = c.length === d.length && crypto.timingSafeEqual(c, d);
  return userOk && passOk;
}

function createToken(payload) {
  const secret = getSessionSecret();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Date.now();
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + TOKEN_EXPIRY_MS
  })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(header + '.' + body)
    .digest('base64url');
  return header + '.' + body + '.' + signature;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const secret = getSessionSecret();
  const [header, body, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(header + '.' + body)
    .digest('base64url');

  const aa = Buffer.from(sig);
  const bb = Buffer.from(expectedSig);
  if (aa.length !== bb.length || !crypto.timingSafeEqual(aa, bb)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function extractToken(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const cookieHeader = event.headers.cookie || '';
  const match = cookieHeader.match(/alsultan_token=([^;]+)/);
  if (match) return match[1];
  return null;
}

function requireAuth(event) {
  const token = extractToken(event);
  const payload = verifyToken(token);
  if (!payload) {
    throw { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized', message: 'Invalid or expired session' }) };
  }
  return payload;
}

/* --- CORS + responses --- */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Cache-Control': 'no-store'
  };
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders()
    },
    body: JSON.stringify(body)
  };
}

module.exports = {
  createToken,
  verifyToken,
  extractToken,
  requireAuth,
  validateCredentials,
  corsHeaders,
  respond,
  catalogGetDefault,
  catalogSave,
  imagePut,
  imageGet,
  TOKEN_EXPIRY_MS
};
