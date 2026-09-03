/* ==========================================================
   save-products.js — Netlify Function: Bulk save (export)
   POST /api/save-products  { products, categories }
   Atomically replaces the catalog in Netlify Blobs (admin only).
   ========================================================== */

'use strict';

const { requireAuth, respond, corsHeaders, catalogSave } = require('./auth-utils');

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

    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return respond(400, { error: 'Invalid JSON', message: 'Request body must be valid JSON' });
    }

    if (!Array.isArray(body.products) || !Array.isArray(body.categories)) {
      return respond(400, {
        error: 'Invalid payload',
        message: 'Body must include products (array) and categories (array)'
      });
    }

    for (const p of body.products) {
      if (!p.id || !p.name || !p.name.ar || !p.name.en || !p.sku) {
        return respond(400, {
          error: 'Validation failed',
          message: 'Every product must have id, name.ar, name.en, and sku'
        });
      }
    }

    for (const c of body.categories) {
      if (!c.id || !c.name || !c.name.ar || !c.name.en) {
        return respond(400, {
          error: 'Validation failed',
          message: 'Every category must have id, name.ar, name.en'
        });
      }
    }

    await catalogSave({ products: body.products, categories: body.categories });

    return respond(200, {
      success: true,
      productsCount: body.products.length,
      categoriesCount: body.categories.length,
      message: 'Catalog saved successfully'
    });

  } catch (err) {
    if (err && err.statusCode) return err;
    return respond(500, { error: 'Internal server error' });
  }
};
