/* ==========================================================
   image.js — Netlify Function: Serve uploaded images
   GET /api/image?name=<filename>
   Reads the image from the Netlify Blobs "images" store and
   returns it with the correct Content-Type. Public endpoint.
   ========================================================== */

'use strict';

const { corsHeaders, imageGet } = require('./auth-utils');

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
    const params = new URLSearchParams((event.rawQuery || '').split('?').pop());
    const name = params.get('name');
    if (!name) {
      return { statusCode: 400, headers: corsHeaders(), body: 'name parameter is required' };
    }

    // Only allow safe image filenames
    if (!/^[A-Za-z0-9_-]+\.(jpe?g|png|webp|gif)$/.test(name)) {
      return { statusCode: 400, headers: corsHeaders(), body: 'Invalid image name' };
    }

    const entry = await imageGet(name);
    if (!entry) {
      return { statusCode: 404, headers: corsHeaders(), body: 'Image not found' };
    }

    const data = entry.data;
    const contentType = (entry.metadata && entry.metadata.contentType) || 'image/jpeg';

    // Convert Blob/ArrayBuffer to base64 string for the AWS-style gateway.
    let base64;
    if (typeof Buffer !== 'undefined') {
      if (Buffer.isBuffer(data)) {
        base64 = data.toString('base64');
      } else if (data instanceof ArrayBuffer) {
        base64 = Buffer.from(data).toString('base64');
      } else if (ArrayBuffer.isView(data)) {
        base64 = Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('base64');
      } else {
        return { statusCode: 500, headers: corsHeaders(), body: 'Unexpected image data' };
      }
    } else {
      const bytes = new Uint8Array(data);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      base64 = Buffer.from(bin, 'binary').toString('base64');
    }

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
