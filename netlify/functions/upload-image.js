/* ==========================================================
   upload-image.js — Netlify Function: Image Upload (Blobs)
   POST /api/upload-image  multipart/form-data { image, productId }
   Validates type, size, magic bytes; stores the image in the
   Netlify Blobs "images" store. Returns a public /api/image URL.
   ========================================================== */

'use strict';

const { requireAuth, respond, corsHeaders, imagePut } = require('./auth-utils');
const crypto = require('crypto');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif']
};

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

/* --- Verify file signature (magic bytes) matches declared MIME type --- */
function matchesMagicBytes(mimeType, buffer) {
  if (!buffer) return false;
  const bytes = [...buffer.subarray(0, 12)];
  switch (mimeType) {
    case 'image/jpeg':
      if (buffer.length < 3) return false;
      return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    case 'image/png':
      if (buffer.length < 4) return false;
      return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    case 'image/gif':
      if (buffer.length < 4) return false;
      return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
    case 'image/webp':
      if (buffer.length < 12) return false;
      return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
             bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    default:
      return false;
  }
}

/* --- Decode the raw request body into a Buffer ---
   Netlify delivers multipart (binary) bodies base64-encoded with
   event.isBase64Encoded = true. We must decode before parsing, and
   parse on a Buffer so binary file bytes survive intact. */
function toBodyBuffer(body, isBase64Encoded) {
  if (body == null) return Buffer.alloc(0);
  if (isBase64Encoded) {
    try {
      return Buffer.from(body, 'base64');
    } catch {
      return Buffer.alloc(0);
    }
  }
  return Buffer.from(body, 'utf8');
}

/* --- Parse multipart form-data (lightweight, no external deps) --- */
function parseMultipart(bodyBuffer, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) return { fields: {}, files: [] };
  const boundary = Buffer.from('--' + (boundaryMatch[1] || boundaryMatch[2]).trim());

  const fields = {};
  const files = [];

  // Collect every delimiter position (the closing `--B--` is matched by its
  // `--B` prefix and simply terminates the stream).
  const delimiters = [];
  let pos = 0;
  while ((pos = bodyBuffer.indexOf(boundary, pos)) !== -1) {
    delimiters.push(pos);
    pos += boundary.length;
  }

  // Each part sits between two consecutive delimiters.
  for (let i = 0; i + 1 < delimiters.length; i++) {
    let part = bodyBuffer.slice(delimiters[i] + boundary.length, delimiters[i + 1]);

    // Strip the CRLF that precedes the next boundary.
    if (part.length >= 2 && part[part.length - 1] === 0x0a && part[part.length - 2] === 0x0d) {
      part = part.slice(0, -2);
    }
    // Skip the leading CRLF right after the boundary.
    if (part.length >= 2 && part[0] === 0x0d && part[1] === 0x0a) {
      part = part.slice(2);
    }
    if (part.length === 0) continue;

    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;

    const headersText = part.slice(0, headerEnd).toString('latin1');
    const content = part.slice(headerEnd + 4);

    const contentDisposition = headersText.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i);
    const contentTypeMatch = headersText.match(/Content-Type:\s*([^\r\n]+)/i);

    if (!contentDisposition) continue;
    const name = contentDisposition[1];
    const filename = contentDisposition[2];

    if (filename !== undefined) {
      files.push({
        field: name,
        filename,
        contentType: contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream',
        content
      });
    } else {
      fields[name] = content.toString('utf8');
    }
  }

  return { fields, files };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed' });
  }

  try {
    let user;
    try {
      user = requireAuth(event);
    } catch (authErr) {
      return authErr;
    }

    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
    const rawBody = toBodyBuffer(event.body, event.isBase64Encoded);
    const { fields, files } = parseMultipart(rawBody, contentType);

    if (files.length === 0) {
      return respond(400, { error: 'No image provided', message: 'An image file is required' });
    }

    const file = files[0];
    const productId = fields.productId || 'product';

    if (file.content.length > MAX_FILE_SIZE) {
      return respond(400, {
        error: 'File too large',
        message: 'Image exceeds the 5MB size limit'
      });
    }

    const mimeType = file.contentType.toLowerCase();
    if (!ALLOWED_MIME_TYPES[mimeType]) {
      return respond(400, {
        error: 'Invalid file type',
        message: 'Only JPG, PNG, WEBP, and GIF images are allowed'
      });
    }

    if (!matchesMagicBytes(mimeType, file.content)) {
      return respond(400, {
        error: 'Invalid file content',
        message: 'The uploaded file does not match its declared image type'
      });
    }

    const originalExt = '.' + (file.filename.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(originalExt)) {
      return respond(400, {
        error: 'Invalid extension',
        message: 'File extension is not allowed'
      });
    }
    const allowedExts = ALLOWED_MIME_TYPES[mimeType];
    const ext = allowedExts.includes(originalExt) ? originalExt : allowedExts[0];

    const safeProductId = productId.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 50) || 'product';
    const random = crypto.randomBytes(4).toString('hex');
    const safeFilename = `${safeProductId}-${Date.now()}-${random}${ext}`;

    await imagePut(safeFilename, file.content, mimeType, event);

    const imageUrl = '/api/image?name=' + encodeURIComponent(safeFilename);

    return respond(201, {
      success: true,
      imageUrl,
      filename: safeFilename
    });

  } catch (err) {
    if (err && err.statusCode) return err;
    const errMsg = (err && err.message) || '';
    if (/blobs|environment has not been configured/i.test(errMsg)) {
      return respond(500, {
        error: 'Storage unavailable',
        message: 'Netlify Blobs is not reachable from this function environment. The request event must carry the auto-provisioned Blobs context (Functions v1 / Lambda compatibility mode).'
      });
    }
    return respond(500, { error: 'Internal server error' });
  }
};

module.exports.parseMultipart = parseMultipart;
module.exports.toBodyBuffer = toBodyBuffer;
