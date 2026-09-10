/* ==========================================================
   products.js — Product Data Loading & Management
   ========================================================== */

const ProductManager = (() => {
  let products = [];
  let categories = [];
  let loaded = false;
  let loadFailed = false;

  const WHATSAPP_NUMBER = '963994683406';
  const SITE_BASE_URL = 'https://alsultan-medical.com';

  function getWhatsAppUrl(text) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }

  /* --- Product-specific public URL (used for QR, share, WhatsApp) --- */
  function getProductUrl(id) {
    return SITE_BASE_URL + '/product.html?id=' + encodeURIComponent(id);
  }

  function getCurrentOrigin() {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return window.location.origin;
    }
    return SITE_BASE_URL;
  }

  // Local (same-origin) product link — for in-page navigation/copies where the
  // deployed origin matters (e.g. local preview). QR/share prefer the canonical base.
  function getLocalProductUrl(id) {
    const base = getCurrentOrigin();
    return base + '/product.html?id=' + encodeURIComponent(id);
  }

  async function loadProducts() {
    if (loaded) return { products, categories, ok: !loadFailed };

    // Public site prefers the live catalog served by the Netlify Function
    // (Blobs-backed), so admin edits show up without re-uploading files.
    // Falls back to the bundled data/products.json (e.g. local preview).
    try {
      const apiResponse = await fetch('/api/products', { cache: 'no-store' });
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        if (Array.isArray(data.products)) {
          products = data.products || [];
          categories = data.categories || [];
          loaded = true;
          loadFailed = false;
          return { products, categories, ok: true };
        }
      }
    } catch (err) {
      console.error('Error loading products from API:', err);
    }

    try {
      const response = await fetch('data/products.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load products');
      const data = await response.json();
      products = data.products || [];
      categories = data.categories || [];
      loaded = true;
      loadFailed = false;
      return { products, categories, ok: true };
    } catch (err) {
      console.error('Error loading products:', err);
      products = [];
      categories = [];
      loaded = true;
      loadFailed = true;
      return { products, categories, ok: false };
    }
  }

  function getProducts() {
    return products;
  }

  function getCategories() {
    return categories;
  }

  function getCategoryById(id) {
    return categories.find(c => c.id === id);
  }

  function getProductById(id) {
    return products.find(p => p.id === id);
  }

  function filterProducts({ search = '', category = 'all', brand = 'all', featuredOnly = false, sort = 'featured' } = {}) {
    let filtered = [...products];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.ar.toLowerCase().includes(q) ||
        p.name.en.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.keywords && p.keywords.some(k => k.toLowerCase().includes(q)))
      );
    }

    if (category !== 'all') {
      filtered = filtered.filter(p => p.category === category);
    }

    if (brand !== 'all') {
      filtered = filtered.filter(p => p.brand === brand);
    }

    if (featuredOnly) {
      filtered = filtered.filter(p => p.featured);
    }

    switch (sort) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'alpha':
        filtered.sort((a, b) => a.name.en.localeCompare(b.name.en));
        break;
      case 'featured':
      default:
        filtered.sort((a, b) => {
          // Numeric display order (ascending) takes precedence.
          const ao = (typeof a.displayOrder === 'number') ? a.displayOrder : 0;
          const bo = (typeof b.displayOrder === 'number') ? b.displayOrder : 0;
          if (ao !== bo) return ao - bo;
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        break;
    }

    return filtered;
  }

  function getLocalizedText(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    const lang = document.documentElement.lang || 'ar';
    return obj[lang] || obj.en || obj.ar || '';
  }

  function generateQuotationMessage(product, customerInfo) {
    const lang = document.documentElement.lang || 'ar';
    const productName = getLocalizedText(product.name);
    const productUrl = getProductUrl(product.id);
    const lines = lang === 'ar'
      ? [
          'مرحباً،',
          '',
          `أرغب بالحصول على عرض سعر للمنتج:`,
          '',
          `📦 المنتج: ${productName}`,
          `🏷️ العلامة التجارية: ${product.brand}`,
          `📋 رقم الصنف: ${product.sku}`,
          `🔗 رابط المنتج: ${productUrl}`,
          '',
          `👤 الاسم: ${customerInfo.name}`,
          `📱 رقم التواصل: ${customerInfo.phone}`,
          customerInfo.email ? `📧 البريد: ${customerInfo.email}` : '',
          customerInfo.message ? `💬 الرسالة: ${customerInfo.message}` : '',
        ]
      : [
          'Hello,',
          '',
          'I would like to get a quotation for:',
          '',
          `📦 Product: ${productName}`,
          `🏷️ Brand: ${product.brand}`,
          `📋 SKU: ${product.sku}`,
          `🔗 Product URL: ${productUrl}`,
          '',
          `👤 Name: ${customerInfo.name}`,
          `📱 Phone: ${customerInfo.phone}`,
          customerInfo.email ? `📧 Email: ${customerInfo.email}` : '',
          customerInfo.message ? `💬 Message: ${customerInfo.message}` : '',
        ];
    return lines.filter(Boolean).join('\n');
  }

  function generateDefaultWhatsAppUrl() {
    const lang = document.documentElement.lang || 'ar';
    const text = lang === 'ar'
      ? 'مرحباً،\nأرغب بالاستفسار عن منتجاتكم الطبية.'
      : 'Hello,\nI would like to inquire about your medical products.';
    return getWhatsAppUrl(text);
  }

  function generateProductWhatsAppUrl(product) {
    const lang = document.documentElement.lang || 'ar';
    const productName = getLocalizedText(product.name);
    const productUrl = getProductUrl(product.id);
    const text = lang === 'ar'
      ? `مرحباً،\nأستفسر عن المنتج: ${productName}\nرقم الصنف: ${product.sku}\nرابط المنتج: ${productUrl}`
      : `Hello,\nI am inquiring about: ${productName}\nSKU: ${product.sku}\nProduct URL: ${productUrl}`;
    return getWhatsAppUrl(text);
  }

  return {
    loadProducts,
    getProducts,
    getCategories,
    getCategoryById,
    getProductById,
    filterProducts,
    getLocalizedText,
    getProductUrl,
    getLocalProductUrl,
    generateQuotationMessage,
    generateDefaultWhatsAppUrl,
    generateProductWhatsAppUrl,
    getWhatsAppUrl,
    WHATSAPP_NUMBER,
    SITE_BASE_URL,
    didFailToLoad: () => loadFailed,
    resetCache() {
      loaded = false;
      loadFailed = false;
    }
  };
})();
