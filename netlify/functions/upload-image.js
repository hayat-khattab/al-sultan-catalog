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

/* --- Parse multipart form-data (lightweight, no external deps) --- */
function parseMultipart(body, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) return { fields: {}, files: [] };
  const boundary = (boundaryMatch[1] || boundaryMatch[2]).trim();

  const parts = body.split('--' + boundary);
  const fields = {};
  const files = [];

  for (const part of parts) {
    if (!part) continue;
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;

    const headersText = part.slice(0, headerEnd);
    const content = part.slice(headerEnd + 4);

    let fileContent = content;
    if (fileContent.endsWith('\r\n')) fileContent = fileContent.slice(0, -2);

    const contentDisposition = headersText.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i);
    const contentTypeMatch = headersText.match(/Content-Type:\s*([^\r\n]+)/i);

    if (!contentDisposition) continue;
    const name = contentDisposition[1];
    const filename = contentDisposition[2];

    if (filename) {
      files.push({
        field: name,
        filename,
        contentType: contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream',
        content: Buffer.from(fileContent, 'binary')
      });
    } else {
      fields[name] = fileContent;
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
    const { fields, files } = parseMultipart(event.body, contentType);

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

    await imagePut(safeFilename, file.content, mimeType);

    const imageUrl = '/api/image?name=' + encodeURIComponent(safeFilename);

    return respond(201, {
      success: true,
      imageUrl,
      filename: safeFilename
    });

  } catch (err) {
    if (err && err.statusCode) return err;
    return respond(500, { error: 'Internal server error' });
  }
};
