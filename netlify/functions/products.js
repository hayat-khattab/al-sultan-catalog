/* ==========================================================
   products.js — Netlify Function: Product CRUD (Blobs-backed)
   Endpoints (all require Bearer token for write ops):
     GET    /api/products              — list all (public)
     POST   /api/products              — add product (admin)
     PUT    /api/products/:id          — update product (admin)
     DELETE /api/products/:id          — delete product (admin)
   Data is stored in Netlify Blobs (self-contained, no GitHub).
   ========================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const {
  requireAuth,
  respond,
  corsHeaders,
  catalogGetDefault,
  catalogSave
} = require('./auth-utils');

const SEED_PATH = path.join(__dirname, 'seed-catalog.json');

/* --- Validate product data server-side --- */
function validateProduct(product) {
  if (!product) return 'Product data is required';

  if (!product.name) return 'Product must have a name';
  if (!product.name.ar || typeof product.name.ar !== 'string') return 'Arabic name is required';
  if (!product.name.en || typeof product.name.en !== 'string') return 'English name is required';

  if (!product.sku || typeof product.sku !== 'string') return 'SKU is required';
  if (!product.category || typeof product.category !== 'string') return 'Category is required';

  if (!product.brand || typeof product.brand !== 'string') product.brand = 'OMEGA Technology';
  if (typeof product.featured !== 'boolean') product.featured = false;
  if (!product.id || typeof product.id !== 'string') product.id = 'product-' + Date.now().toString(36);

  if (!product.createdAt) product.createdAt = new Date().toISOString().split('T')[0];

  const sanitize = (v) => typeof v === 'string' ? v.trim() : '';
  product.name.ar = sanitize(product.name.ar);
  product.name.en = sanitize(product.name.en);
  product.sku = sanitize(product.sku);
  product.brand = sanitize(product.brand);

  if (!product.name.ar || !product.name.en) return 'Product names cannot be empty';
  if (!product.sku) return 'SKU cannot be empty';

  return null;
}

/* --- Load catalog; seed from bundled file on first run --- */
async function loadCatalog() {
  let catalog = await catalogGetDefault();

  if (!catalog || !Array.isArray(catalog.products)) {
    let seed = { products: [], categories: [] };
    try {
      seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
    } catch {
      // No bundled seed available
      seed = { products: [], categories: [] };
    }
    await catalogSave(seed);
    return seed;
  }

  // Normalize
  return {
    products: Array.isArray(catalog.products) ? catalog.products : [],
    categories: Array.isArray(catalog.categories) ? catalog.categories : []
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  const pathParts = (event.path || '').split('/').filter(s => s.length > 0);
  let productId = null;
  const ix = pathParts.lastIndexOf('products');
  if (ix !== -1 && ix + 1 < pathParts.length) {
    productId = pathParts[ix + 1];
  }

  try {
    // --- READ (public) ---
    if (event.httpMethod === 'GET') {
      const data = await loadCatalog();
      return respond(200, { products: data.products, categories: data.categories });
    }

    // --- WRITE operations require auth ---
    let user;
    try {
      user = requireAuth(event);
    } catch (authErr) {
      return authErr;
    }

    // --- CREATE product ---
    if (event.httpMethod === 'POST') {
      let product;
      try {
        const body = JSON.parse(event.body || '{}');
        product = body.product || body;
      } catch {
        return respond(400, { error: 'Invalid JSON', message: 'Request body must be valid JSON' });
      }

      const validationError = validateProduct(product);
      if (validationError) {
        return respond(400, { error: 'Validation failed', message: validationError });
      }

      const data = await loadCatalog();

      if (data.products.some(p => p.sku === product.sku)) {
        return respond(409, { error: 'Conflict', message: 'Product with this SKU already exists' });
      }

      data.products.push(product);
      await catalogSave({ products: data.products, categories: data.categories });

      return respond(201, { success: true, product });
    }

    // --- UPDATE product ---
    if (event.httpMethod === 'PUT') {
      if (!productId) return respond(400, { error: 'Missing product id' });

      let updates;
      try {
        const body = JSON.parse(event.body || '{}');
        updates = body.product || body;
      } catch {
        return respond(400, { error: 'Invalid JSON', message: 'Request body must be valid JSON' });
      }
      delete updates.id;

      const data = await loadCatalog();
      const idx = data.products.findIndex(p => p.id === productId);
      if (idx === -1) {
        return respond(404, { error: 'Not found', message: 'Product not found' });
      }

      const merged = { ...data.products[idx], ...updates, id: productId };
      const validationError = validateProduct(merged);
      if (validationError) {
        return respond(400, { error: 'Validation failed', message: validationError });
      }

      data.products[idx] = merged;
      await catalogSave({ products: data.products, categories: data.categories });

      return respond(200, { success: true, product: merged });
    }

    // --- DELETE product ---
    if (event.httpMethod === 'DELETE') {
      if (!productId) return respond(400, { error: 'Missing product id' });

      const data = await loadCatalog();
      const idx = data.products.findIndex(p => p.id === productId);
      if (idx === -1) {
        return respond(404, { error: 'Not found', message: 'Product not found' });
      }

      const deleted = data.products[idx];
      data.products.splice(idx, 1);
      await catalogSave({ products: data.products, categories: data.categories });

      return respond(200, { success: true, deletedId: productId });
    }

    return respond(405, { error: 'Method not allowed' });

  } catch (err) {
    if (err && err.statusCode) return err;
    return respond(500, { error: 'Internal server error', message: err && err.message, detail: err && err.stack ? String(err.stack).split('\n').slice(0,3).join('\n') : undefined });
  }
};
