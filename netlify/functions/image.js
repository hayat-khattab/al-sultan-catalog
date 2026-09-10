/* ==========================================================
   image.js — Netlify Function: Serve uploaded images
   GET /api/image?name=<filename>
   Reads the image from the Netlify Blobs "images" store and
   returns it with the correct Content-Type. Public endpoint.
   ========================================================== */

'use strict';

const { corsHeaders, imageGet } = require('./auth-utils');

/* --- Read the `name` query parameter robustly ---
   Netlify exposes parsed params on event.queryStringParameters; fall back to
   parsing event.rawQuery manually when that is unavailable. */
function getImageName(event) {
  const parsed = event.queryStringParameters;
  if (parsed && typeof parsed.name === 'string' && parsed.name) {
    return parsed.name;
  }
  if (event.rawQuery) {
    const params = new URLSearchParams(event.rawQuery.split('?').pop());
    const name = params.get('name');
    if (typeof name === 'string' && name) return name;
  }
  return null;
}

/* --- Convert blob data to base64 for the AWS-style gateway.
   Netlify Blobs `type: 'blob'` reads resolve to a WHATWG Blob; handle every
   value shape the store can return so valid images never fall through to
   "Unexpected image data". */
async function dataToBase64(data) {
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
    return data.toString('base64');
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString('base64');
  }
  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('base64');
  }
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    return Buffer.from(await data.arrayBuffer()).toString('base64');
  }
  if (data && typeof data.arrayBuffer === 'function') {
    return Buffer.from(await data.arrayBuffer()).toString('base64');
  }
  throw new Error('Unexpected image data: ' + Object.prototype.toString.call(data));
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const name = getImageName(event);
    if (!name) {
      return { statusCode: 400, headers: corsHeaders(), body: 'name parameter is required' };
    }

    // Only allow safe image filenames
    if (!/^[A-Za-z0-9_-]+\.(jpe?g|png|webp|gif)$/.test(name)) {
      return { statusCode: 400, headers: corsHeaders(), body: 'Invalid image name' };
    }

    const entry = await imageGet(name, event);
    if (!entry) {
      return { statusCode: 404, headers: corsHeaders(), body: 'Image not found' };
    }

    const data = entry.data;
    const contentType = (entry.metadata && entry.metadata.contentType) || 'image/jpeg';

    // Blob values are converted via await data.arrayBuffer() (never treated
    // as an invalid/unexpected value).
    const base64 = await dataToBase64(data);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...corsHeaders()
      },
      isBase64Encoded: true,
      body: base64
    };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders(), body: 'Internal server error' };
  }
};
