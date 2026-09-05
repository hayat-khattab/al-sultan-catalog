/* ==========================================================
   admin.js — AL SULTAN Admin Dashboard
   Phase 3 — Connected to Netlify Functions + GitHub
   ========================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     CONFIG
     ---------------------------------------------------------- */
  let isLoggedIn = false;
  let products = [];
  let categories = [];
  let currentTheme = localStorage.getItem('adminTheme') || 'dark';
  let currentLang = 'ar';
  let editingProductId = null;
  let pendingDeleteId = null;
  let pendingQRProductId = null;
  let imageData = null; // base64 string for current form image preview
  let imageFile = null; // selected File to upload on save (file reference, not base64)

  // API base — uses /api redirects (mapped to functions via netlify.toml)
  // or falls back to /.netlify/functions directly.
  const API_BASE = '/api';

  // Session token is stored in-memory only (NOT localStorage).
  // On page reload, the user must log in again. This avoids
  // persisting secrets client-side while still being usable.
  let authToken = null;

  /* ----------------------------------------------------------
     AUTH — connects to Netlify Function /api/login
     Credentials are sent server-side; never stored locally.
     ---------------------------------------------------------- */
  const Auth = {
    async login(username, password) {
      const resp = await fetch(API_BASE + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }
      authToken = data.token;
      isLoggedIn = true;
      return data;
    },
    async verifySession() {
      if (!authToken) return false;
      try {
        const resp = await fetch(API_BASE + '/login', {
          headers: { 'Authorization': 'Bearer ' + authToken }
        });
        return resp.ok;
      } catch {
        return false;
      }
    },
    getToken() {
      return authToken;
    },
    logout() {
      authToken = null;
      isLoggedIn = false;
    }
  };

  /* ----------------------------------------------------------
     DATA LAYER — connects to Netlify Functions + GitHub
     ---------------------------------------------------------- */
  const DataStore = {
    async load() {
      try {
        const resp = await fetch(API_BASE + '/products');
        if (!resp.ok) throw new Error('Failed to load from API');
        const data = await resp.json();
        products = data.products || [];
        categories = data.categories || [];
      } catch (e) {
        console.error('Failed to load products from API, falling back to local file:', e);
        try {
          const resp2 = await fetch('data/products.json');
          const data2 = await resp2.json();
          products = data2.products || [];
          categories = data2.categories || [];
        } catch (e2) {
          console.error('Local fallback failed too:', e2);
          products = [];
          categories = [];
        }
      }
    },
    getProducts() { return products; },
    getCategories() { return categories; },
    getProductById(id) { return products.find(p => p.id === id); },
    getCategoryById(id) { return categories.find(c => c.id === id); },

    async addProduct(product) {
      const resp = await fetch(API_BASE + '/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + Auth.getToken()
        },
        body: JSON.stringify({ product })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || data.error || 'Failed to add product');
      }
      if (data.product) products.push(data.product);
      return data;
    },

    async updateProduct(id, updates) {
      const resp = await fetch(API_BASE + '/products/' + encodeURIComponent(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + Auth.getToken()
        },
        body: JSON.stringify({ product: updates })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || data.error || 'Failed to update product');
      }
      if (data.product) {
        const idx = products.findIndex(p => p.id === id);
        if (idx !== -1) products[idx] = data.product;
      }
      return data;
    },

    async deleteProduct(id) {
      const resp = await fetch(API_BASE + '/products/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + Auth.getToken()
        }
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || data.error || 'Failed to delete product');
      }
      products = products.filter(p => p.id !== id);
      return data;
    },

    exportJSON() {
      return JSON.stringify({ products, categories }, null, 2);
    },

    async importJSON(jsonStr) {
      const data = JSON.parse(jsonStr);
      if (data.products) products = data.products;
      if (data.categories) categories = data.categories;

      // Persist via save-products (admin only)
      const resp = await fetch(API_BASE + '/save-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + Auth.getToken()
        },
        body: JSON.stringify({ products, categories })
      });
      const result = await resp.json();
      if (!resp.ok) {
        throw new Error(result.message || result.error || 'Failed to save catalog');
      }
      return result;
    }
  };

  /* ----------------------------------------------------------
     IMAGE UPLOAD — via Netlify Function /api/upload-image
     ---------------------------------------------------------- */
  const ImageUpload = {
    async upload(file, productId) {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('productId', productId || 'product');

      const resp = await fetch(API_BASE + '/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + Auth.getToken()
        },
        body: formData
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || data.error || 'Failed to upload image');
      }
      return data.imageUrl;
    }
  };

  /* ----------------------------------------------------------
     UTILITIES
     ---------------------------------------------------------- */
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function getLocalizedText(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[currentLang] || obj.en || obj.ar || '';
  }

  function generateId() {
    return 'product-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(currentLang === 'ar' ? 'ar-SY' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  function toast(message, type) {
    type = type || 'info';
    const container = $('#toastContainer');
    const el = document.createElement('div');
    el.className = 'toast toast--' + type;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(12px)';
      el.style.transition = '0.3s ease';
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }

  /* --- Modal focus management (a11y) --- */
  const modalFocus = { el: null };

  function getFocusable(modal) {
    return modal.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  }

  function openAdminModal(modal) {
    if (!modal) return;
    modalFocus.el = document.activeElement;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    const focusable = getFocusable(modal);
    if (focusable.length) focusable[0].focus();

    if (modal.__keyH) modal.removeEventListener('keydown', modal.__keyH);
    modal.__keyH = (e) => {
      if (e.key !== 'Tab') return;
      const items = getFocusable(modal);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    modal.addEventListener('keydown', modal.__keyH);
  }

  function closeAdminModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    if (modal.__keyH) { modal.removeEventListener('keydown', modal.__keyH); modal.__keyH = null; }
    if (modalFocus.el && modalFocus.el.focus) modalFocus.el.focus();
    modalFocus.el = null;
  }

  /* ----------------------------------------------------------
     VIEW SWITCHING
     ---------------------------------------------------------- */
  function switchView(viewName) {
    $$('.view').forEach(v => { v.hidden = true; v.classList.remove('active'); });
    const target = document.querySelector('.view[data-view="' + viewName + '"]');
    if (target) { target.hidden = false; target.classList.add('active'); }

    $$('.sidebar__link[data-view]').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === viewName);
    });

    const titles = {
      'dashboard': 'لوحة التحكم',
      'products': 'المنتجات',
      'add-product': editingProductId ? 'تعديل منتج' : 'إضافة منتج جديد',
      'categories': 'التصنيفات',
      'settings': 'الإعدادات'
    };
    $('#topbarTitle').textContent = titles[viewName] || viewName;

    if (viewName === 'products') renderProductsTable();
    if (viewName === 'dashboard') renderDashboard();
    if (viewName === 'categories') renderAdminCategories();
    if (viewName === 'add-product' && !editingProductId) resetProductForm();
  }

  /* ----------------------------------------------------------
     LOGIN
     ---------------------------------------------------------- */
  function setupLogin() {
    const form = $('#loginForm');
    const toggle = $('#passwordToggle');
    const pwInput = $('#loginPassword');

    toggle.addEventListener('click', () => {
      const isPassword = pwInput.type === 'password';
      pwInput.type = isPassword ? 'text' : 'password';
      toggle.innerHTML = isPassword
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = $('#loginEmail').value.trim();
      const password = $('#loginPassword').value;
      const errorEl = $('#loginError');
      const btn = $('#loginBtn');

      btn.textContent = 'جاري التحقق...';
      btn.disabled = true;
      errorEl.hidden = true;

      let loginSucceeded = false;
      try {
        const loginData = await Auth.login(username, password);
        loginSucceeded = true;
        // Token received (in-memory only). Never log the token itself.
        console.info('[admin] login OK: token received =', !!loginData.token, '| expiresAt =', !!loginData.expiresAt);
      } catch (err) {
        console.error('[admin] login failed:', err && err.message);
        errorEl.textContent = 'بيانات الدخول غير صحيحة';
        errorEl.hidden = false;
      } finally {
        btn.textContent = 'تسجيل الدخول';
        btn.disabled = false;
      }

      // Only enter the control panel after proven authentication.
      if (!loginSucceeded) return;

      isLoggedIn = true;
      showAdminShell(); // hides #loginScreen, shows #adminShell, sets data-view=admin

      // Load the catalog in the background. A failure here must NEVER
      // revert the user to the login screen nor trigger the login error UI.
      try {
        await DataStore.load();
        renderDashboard();
      } catch (loadErr) {
        console.error('[admin] catalog load failed after login (staying in dashboard):', loadErr);
        try { renderDashboard(); } catch (_) { /* dashboard stays visible regardless */ }
      }
    });
  }

  function showAdminShell() {
    const loginScreen = $('#loginScreen');
    const adminShell = $('#adminShell');
    loginScreen.hidden = true;
    loginScreen.style.display = 'none';
    adminShell.hidden = false;
    adminShell.style.display = 'flex';
    document.body.dataset.view = 'admin';
    console.info('[admin] showAdminShell: loginScreen.hidden =', loginScreen.hidden, '| adminShell.hidden =', adminShell.hidden, '| view = admin');
    try {
      renderDashboard();
    } catch (err) {
      // A dashboard render problem must not undo the authenticated state.
      console.error('[admin] dashboard render failed after login (login remains active):', err);
    }
  }

  function showLoginScreen() {
    const loginScreen = $('#loginScreen');
    const adminShell = $('#adminShell');
    loginScreen.hidden = false;
    loginScreen.style.display = 'flex';
    adminShell.hidden = true;
    adminShell.style.display = 'none';
    document.body.dataset.view = 'login';
    $('#loginForm').reset();
    Auth.logout();
  }

  /* ----------------------------------------------------------
     DASHBOARD
     ---------------------------------------------------------- */
  function renderDashboard() {
    const all = DataStore.getProducts();
    $('#statTotalProducts').textContent = all.length;
    $('#statFeaturedProducts').textContent = all.filter(p => p.featured).length;
    $('#statCategories').textContent = DataStore.getCategories().length;

    const latest = all.reduce((max, p) => p.createdAt > max ? p.createdAt : max, '');
    $('#statLastUpdate').textContent = formatDate(latest);

    const tbody = $('#dashboardTableBody');
    const recent = [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

    tbody.innerHTML = recent.map(p => {
      const name = getLocalizedText(p.name);
      const cat = DataStore.getCategoryById(p.category);
      const catName = cat ? getLocalizedText(cat.name) : p.category;
      return '<tr>' +
        '<td><div class="table__product"><div class="table__product-img"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>' + escapeHtml(name) + '</div></td>' +
        '<td>' + escapeHtml(catName) + '</td>' +
        '<td>' + escapeHtml(p.brand) + '</td>' +
        '<td><span class="table__sku">' + escapeHtml(p.sku) + '</span></td>' +
        '<td>' + (p.featured ? '<span class="table__badge table__badge--featured">مميز</span>' : '<span class="table__badge table__badge--normal">عادي</span>') + '</td>' +
        '<td><div class="table__actions">' +
          '<button class="btn btn--ghost btn--sm" data-action="edit" data-id="' + p.id + '">تعديل</button>' +
          '<button class="btn btn--ghost btn--sm" data-action="preview" data-id="' + p.id + '">معاينة</button>' +
          '<button class="btn btn--ghost btn--sm" data-action="qr" data-id="' + p.id + '">QR Code</button>' +
          '<button class="btn btn--ghost btn--sm" data-action="copy" data-id="' + p.id + '">نسخ الرابط</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');

    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => openEditForm(btn.dataset.id));
    });
    tbody.querySelectorAll('[data-action="preview"]').forEach(btn => {
      btn.addEventListener('click', () => openPreviewModal(btn.dataset.id));
    });
    tbody.querySelectorAll('[data-action="qr"]').forEach(btn => {
      btn.addEventListener('click', () => openQRModal(btn.dataset.id));
    });
    tbody.querySelectorAll('[data-action="copy"]').forEach(btn => {
      btn.addEventListener('click', () => copyProductLink(btn.dataset.id));
    });
  }

  /* ----------------------------------------------------------
     PRODUCTS TABLE
     ---------------------------------------------------------- */
  function renderProductsTable() {
    const all = DataStore.getProducts();
    const searchVal = ($('#adminSearchInput') || {}).value || '';
    const catVal = ($('#adminCategoryFilter') || {}).value || 'all';

    let filtered = all;

    if (searchVal) {
      const q = searchVal.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.ar.toLowerCase().includes(q) ||
        p.name.en.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }

    if (catVal !== 'all') {
      filtered = filtered.filter(p => p.category === catVal);
    }

    const tbody = $('#productsTableBody');
    const empty = $('#productsEmpty');

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    tbody.innerHTML = filtered.map(p => {
      const name = getLocalizedText(p.name);
      const cat = DataStore.getCategoryById(p.category);
      const catName = cat ? getLocalizedText(cat.name) : p.category;
      const order = (typeof p.displayOrder === 'number') ? p.displayOrder : 0;
      return '<tr>' +
        '<td><div class="table__product-img"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div></td>' +
        '<td><div class="table__product">' + escapeHtml(name) + '</div></td>' +
        '<td>' + escapeHtml(catName) + '</td>' +
        '<td>' + escapeHtml(p.brand) + '</td>' +
        '<td><span class="table__sku">' + escapeHtml(p.sku) + '</span></td>' +
        '<td><span class="table__badge table__badge--published">منشور</span></td>' +
        '<td><input type="number" class="table__order-input" data-action="order" data-id="' + p.id + '" value="' + order + '" min="0" aria-label="Display order"></td>' +
        '<td><button type="button" class="table__featured-toggle' + (p.featured ? ' is-featured' : '') + '" data-action="featured" data-id="' + p.id + '" aria-pressed="' + (p.featured ? 'true' : 'false') + '">' + (p.featured ? 'مميز' : 'عادي') + '</button></td>' +
        '<td><div class="table__actions">' +
          '<button class="btn btn--ghost btn--sm" data-action="edit" data-id="' + p.id + '">تعديل</button>' +
          '<button class="btn btn--ghost btn--sm" data-action="preview" data-id="' + p.id + '">معاينة</button>' +
          '<button class="btn btn--ghost btn--sm" data-action="qr" data-id="' + p.id + '">QR Code</button>' +
          '<button class="btn btn--ghost btn--sm" data-action="copy" data-id="' + p.id + '">نسخ الرابط</button>' +
          '<button class="btn btn--danger btn--sm" data-action="delete" data-id="' + p.id + '">حذف</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');

    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => openEditForm(btn.dataset.id));
    });
    tbody.querySelectorAll('[data-action="preview"]').forEach(btn => {
      btn.addEventListener('click', () => openPreviewModal(btn.dataset.id));
    });
    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
    });
    tbody.querySelectorAll('[data-action="qr"]').forEach(btn => {
      btn.addEventListener('click', () => openQRModal(btn.dataset.id));
    });
    tbody.querySelectorAll('[data-action="copy"]').forEach(btn => {
      btn.addEventListener('click', () => copyProductLink(btn.dataset.id));
    });
    tbody.querySelectorAll('[data-action="featured"]').forEach(btn => {
      btn.addEventListener('click', () => toggleFeaturedQuick(btn.dataset.id, btn));
    });
    tbody.querySelectorAll('[data-action="order"]').forEach(input => {
      input.addEventListener('change', () => quickSetOrder(input.dataset.id, input.value));
    });
  }

  /* --- Quick featured toggle (updates remote + local immediately) --- */
  async function toggleFeaturedQuick(productId, btn) {
    const product = DataStore.getProductById(productId);
    if (!product) return;
    const newVal = !product.featured;
    try {
      const merged = { ...product, featured: newVal };
      const result = await DataStore.updateProduct(productId, { featured: newVal });
      // reflect returned product
      if (result.product) {
        const idx = DataStore.getProducts().findIndex(p => p.id === productId);
        if (idx !== -1) DataStore.getProducts()[idx] = result.product;
      }
      btn.classList.toggle('is-featured', newVal);
      btn.setAttribute('aria-pressed', newVal ? 'true' : 'false');
      btn.textContent = newVal ? 'مميز' : 'عادي';
      toast(newVal ? 'تم تمييز المنتج' : 'تم إلغاء التمييز', 'success');
      renderDashboard();
    } catch (err) {
      toast(err.message || 'فشل تحديث الحالة', 'error');
    }
  }

  /* --- Quick display-order set (remote + local) --- */
  async function quickSetOrder(productId, value) {
    const order = parseInt(value, 10);
    const newOrder = isNaN(order) || order < 0 ? 0 : order;
    const product = DataStore.getProductById(productId);
    if (!product) return;
    try {
      const result = await DataStore.updateProduct(productId, { displayOrder: newOrder });
      if (result.product) {
        const idx = DataStore.getProducts().findIndex(p => p.id === productId);
        if (idx !== -1) DataStore.getProducts()[idx] = result.product;
      }
      toast('تم تحديث ترتيب العرض', 'success');
    } catch (err) {
      toast(err.message || 'فشل تحديث الترتيب', 'error');
    }
  }

  /* ----------------------------------------------------------
     PRODUCT FORM — Add / Edit
     ---------------------------------------------------------- */
  function resetProductForm() {
    editingProductId = null;
    imageData = null;
    $('#productFormTitle').textContent = 'إضافة منتج جديد';
    $('#saveProductBtn').textContent = 'حفظ المنتج';
    $('#formProductId').value = '';
    $('#formNameAr').value = '';
    $('#formNameEn').value = '';
    $('#formCategory').value = '';
    $('#formBrand').value = 'OMEGA Technology';
    $('#formSku').value = '';
    $('#formDescAr').value = '';
    $('#formDescEn').value = '';
    $('#formFullDescAr').value = '';
    $('#formFullDescEn').value = '';
    $('#formFeaturesAr').value = '';
    $('#formFeaturesEn').value = '';
    $('#formWarrantyAr').value = '';
    $('#formWarrantyEn').value = '';
    $('#formAfterSalesAr').value = '';
    $('#formAfterSalesEn').value = '';
    $('#formKeywords').value = '';
    $('#formDisplayOrder').value = '0';
    $('#formFeatured').checked = false;
    resetImagePreview();
    resetSpecs();
    $('#specsContainer').innerHTML = '';
  }

  function openEditForm(productId) {
    const product = DataStore.getProductById(productId);
    if (!product) return;

    editingProductId = productId;
    resetProductForm();
    editingProductId = productId;

    $('#productFormTitle').textContent = 'تعديل منتج';
    $('#saveProductBtn').textContent = 'تحديث المنتج';
    $('#formProductId').value = productId;
    $('#formNameAr').value = product.name.ar || '';
    $('#formNameEn').value = product.name.en || '';
    $('#formCategory').value = product.category || '';
    $('#formBrand').value = product.brand || '';
    $('#formSku').value = product.sku || '';
    $('#formDescAr').value = (product.description && product.description.ar) || '';
    $('#formDescEn').value = (product.description && product.description.en) || '';
    $('#formFullDescAr').value = (product.description && product.description.ar) || '';
    $('#formFullDescEn').value = (product.description && product.description.en) || '';
    $('#formFeaturesAr').value = (product.features && product.features.ar) ? product.features.ar.join(', ') : '';
    $('#formFeaturesEn').value = (product.features && product.features.en) ? product.features.en.join(', ') : '';
    $('#formWarrantyAr').value = (product.warranty && product.warranty.ar) || '';
    $('#formWarrantyEn').value = (product.warranty && product.warranty.en) || '';
    $('#formAfterSalesAr').value = (product.afterSales && product.afterSales.ar) || '';
    $('#formAfterSalesEn').value = (product.afterSales && product.afterSales.en) || '';
    $('#formKeywords').value = product.keywords ? product.keywords.join(', ') : '';
    $('#formDisplayOrder').value = (typeof product.displayOrder === 'number') ? product.displayOrder : 0;
    $('#formFeatured').checked = !!product.featured;

    // Load image
    if (product.image) {
      imageData = product.image;
      showImagePreview(product.image);
    }

    // Load specs
    loadSpecsIntoForm(product);

    switchView('add-product');
  }

  function loadSpecsIntoForm(product) {
    const container = $('#specsContainer');
    container.innerHTML = '';
    const specsAr = (product.specifications && product.specifications.ar) || [];
    const specsEn = (product.specifications && product.specifications.en) || [];

    const maxLen = Math.max(specsAr.length, specsEn.length);
    for (let i = 0; i < maxLen; i++) {
      addSpecRow(
        specsAr[i] ? specsAr[i].key : '',
        specsAr[i] ? specsAr[i].value : '',
        specsEn[i] ? specsEn[i].key : '',
        specsEn[i] ? specsEn[i].value : ''
      );
    }
  }

  function resetSpecs() {
    $('#specsContainer').innerHTML = '';
    addSpecRow('', '', '', '');
  }

  function addSpecRow(keyAr, valAr, keyEn, valEn) {
    const container = $('#specsContainer');
    const row = document.createElement('div');
    row.className = 'spec-row';
    row.innerHTML =
      '<div class="form-group"><label>المفتاح (عربي)</label><input type="text" class="input spec-key-ar" value="' + escapeHtml(keyAr) + '"></div>' +
      '<div class="form-group"><label>القيمة (عربي)</label><input type="text" class="input spec-val-ar" value="' + escapeHtml(valAr) + '"></div>' +
      '<div class="form-group"><label>Key (EN)</label><input type="text" class="input spec-key-en" value="' + escapeHtml(keyEn) + '"></div>' +
      '<div class="form-group"><label>Value (EN)</label><input type="text" class="input spec-val-en" value="' + escapeHtml(valEn) + '"></div>' +
      '<button type="button" class="btn btn--danger btn--sm spec-remove" aria-label="Remove spec" style="align-self:end;margin-bottom:0.75rem;">✕</button>';
    container.appendChild(row);

    row.querySelector('.spec-remove').addEventListener('click', () => {
      if (container.children.length > 1) row.remove();
    });
  }

  function collectSpecsFromForm() {
    const rows = $$('#specsContainer .spec-row');
    const ar = [];
    const en = [];
    rows.forEach(row => {
      const kAr = row.querySelector('.spec-key-ar').value.trim();
      const vAr = row.querySelector('.spec-val-ar').value.trim();
      const kEn = row.querySelector('.spec-key-en').value.trim();
      const vEn = row.querySelector('.spec-val-en').value.trim();
      if (kAr || vAr) ar.push({ key: kAr, value: vAr });
      if (kEn || vEn) en.push({ key: kEn, value: vEn });
    });
    return { ar, en };
  }

  /* --- Image handling --- */
  function resetImagePreview() {
    imageData = null;
    imageFile = null;
    const preview = $('#imagePreview');
    preview.classList.remove('has-image');
    preview.querySelector('img')?.remove();
    preview.querySelectorAll('svg, span').forEach(el => el.style.display = '');
    $('#imageActions').hidden = true;
  }

  function showImagePreview(src) {
    const preview = $('#imagePreview');
    preview.querySelectorAll('svg, span').forEach(el => el.style.display = 'none');
    let img = preview.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      preview.appendChild(img);
    }
    img.src = src;
    preview.classList.add('has-image');
    $('#imageActions').hidden = false;
  }

  function setupImageUpload() {
    const preview = $('#imagePreview');
    const input = $('#imageFileInput');

    preview.addEventListener('click', () => input.click());

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      imageFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        imageData = ev.target.result;
        showImagePreview(imageData);
      };
      reader.readAsDataURL(file);
    });

    $('#imageReplace').addEventListener('click', (e) => {
      e.stopPropagation();
      input.click();
    });

    $('#imageRemove').addEventListener('click', (e) => {
      e.stopPropagation();
      resetImagePreview();
    });
  }

  /* --- Form Submit --- */
  function setupProductForm() {
    $('#addSpecBtn').addEventListener('click', () => addSpecRow('', '', '', ''));

    $('#productForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameAr = $('#formNameAr').value.trim();
      const nameEn = $('#formNameEn').value.trim();
      const category = $('#formCategory').value;
      const sku = $('#formSku').value.trim();

      if (!nameAr || !nameEn || !category || !sku) {
        toast('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
      }

      const specs = collectSpecsFromForm();
      const featuresAr = $('#formFeaturesAr').value.split(',').map(s => s.trim()).filter(Boolean);
      const featuresEn = $('#formFeaturesEn').value.split(',').map(s => s.trim()).filter(Boolean);
      const keywords = $('#formKeywords').value.split(',').map(s => s.trim()).filter(Boolean);

      const now = new Date().toISOString().split('T')[0];
      const displayOrder = parseInt($('#formDisplayOrder').value, 10);
      const productData = {
        name: { ar: nameAr, en: nameEn },
        brand: $('#formBrand').value.trim() || 'OMEGA Technology',
        category: category,
        sku: sku,
        description: {
          ar: $('#formDescAr').value.trim() || nameAr,
          en: $('#formDescEn').value.trim() || nameEn
        },
        features: { ar: featuresAr, en: featuresEn },
        specifications: specs,
        warranty: {
          ar: $('#formWarrantyAr').value.trim(),
          en: $('#formWarrantyEn').value.trim()
        },
        afterSales: {
          ar: $('#formAfterSalesAr').value.trim(),
          en: $('#formAfterSalesEn').value.trim()
        },
        featured: $('#formFeatured').checked,
        keywords: keywords,
        displayOrder: isNaN(displayOrder) || displayOrder < 0 ? 0 : displayOrder,
        createdAt: now
      };

      // Resolve the target product id (new products get one up front so the
      // image filename can be scoped to it).
      const targetId = editingProductId || generateId();
      if (!editingProductId) productData.id = targetId;

      const saveBtn = $('#saveProductBtn');
      const originalText = saveBtn.textContent;
      saveBtn.disabled = true;
      saveBtn.textContent = 'جاري الحفظ...';

      try {
        // Upload a new image (as a file, not base64) if one was chosen.
        if (imageFile) {
          const uploadedUrl = await ImageUpload.upload(imageFile, targetId);
          productData.image = uploadedUrl;
        } else if (editingProductId) {
          // Keep the existing image reference when editing without a new file.
          const existing = DataStore.getProductById(editingProductId);
          if (existing && existing.image) productData.image = existing.image;
          else productData.image = null;
        } else {
          productData.image = null;
        }

        if (editingProductId) {
          await DataStore.updateProduct(editingProductId, productData);
          toast('تم تحديث المنتج بنجاح', 'success');
        } else {
          await DataStore.addProduct(productData);
          toast('تم إضافة المنتج بنجاح', 'success');
        }

        imageFile = null;
        editingProductId = null;
        switchView('products');
      } catch (err) {
        toast(err.message || 'فشل الحفظ', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
      }
    });
  }

  /* --- Preview --- */
  function openPreviewModal(productId) {
    const product = DataStore.getProductById(productId);
    if (!product) return;

    const lang = currentLang;
    const name = getLocalizedText(product.name);
    const desc = getLocalizedText(product.description);
    const features = product.features?.[lang] || product.features?.ar || [];
    const specs = product.specifications?.[lang] || product.specifications?.ar || [];
    const cat = DataStore.getCategoryById(product.category);
    const catName = cat ? getLocalizedText(cat.name) : product.category;

    let html = '<div class="preview-product">';

    if (product.image) {
      html += '<div class="preview-product__image"><img src="' + product.image + '" alt="' + escapeHtml(name) + '" style="width:100%;height:100%;object-fit:cover;"></div>';
    } else {
      html += '<div class="preview-product__image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>';
    }

    html += '<div class="preview-product__name">' + escapeHtml(name) + '</div>';
    html += '<div class="preview-product__meta">';
    html += '<span>🏷️ ' + escapeHtml(product.brand) + '</span>';
    html += '<span>📂 ' + escapeHtml(catName) + '</span>';
    html += '<span>📋 ' + escapeHtml(product.sku) + '</span>';
    html += '<span>📅 ' + formatDate(product.createdAt) + '</span>';
    html += '</div>';
    html += '<div class="preview-product__desc">' + escapeHtml(desc) + '</div>';

    if (features.length > 0) {
      html += '<div class="preview-product__section"><h4>الميزات</h4><ul class="preview-product__list">';
      features.forEach(f => { html += '<li>' + escapeHtml(f) + '</li>'; });
      html += '</ul></div>';
    }

    if (specs.length > 0) {
      html += '<div class="preview-product__section"><h4>المواصفات</h4><table class="preview-product__specs-table">';
      specs.forEach(s => {
        html += '<tr><td>' + escapeHtml(s.key) + '</td><td>' + escapeHtml(s.value) + '</td></tr>';
      });
      html += '</table></div>';
    }

    if (product.warranty) {
      const warranty = getLocalizedText(product.warranty);
      if (warranty) html += '<div class="preview-product__section"><p><strong>الضمان:</strong> ' + escapeHtml(warranty) + '</p></div>';
    }

    if (product.afterSales) {
      const afterSales = getLocalizedText(product.afterSales);
      if (afterSales) html += '<div class="preview-product__section"><p><strong>خدمة ما بعد البيع:</strong> ' + escapeHtml(afterSales) + '</p></div>';
    }

    html += '</div>';

    $('#previewModalBody').innerHTML = html;
    openAdminModal($('#previewModal'));
  }

  function closePreviewModal() {
    closeAdminModal($('#previewModal'));
  }

  /* ----------------------------------------------------------
     QR CODE — per product (preview / download / copy link)
     ---------------------------------------------------------- */
  function openQRModal(productId) {
    const product = DataStore.getProductById(productId);
    if (!product) return;

    const name = getLocalizedText(product.name);
    const url = ProductManager.getProductUrl(productId);

    pendingQRProductId = productId;
    $('#qrProductName').textContent = name + ' — ' + product.sku;
    $('#qrLinkInput').value = url;
    $('#qrFeedback').hidden = true;
    renderQR(url);

    openAdminModal($('#qrModal'));
  }

  function renderQR(url) {
    const container = $('#qrCanvas');
    container.innerHTML = '';
    try {
      const qr = qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      container.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0 });
    } catch (e) {
      container.innerHTML = '<p class="qr-modal__product">تعذر توليد QR</p>';
    }
  }

  function closeQRModal() {
    closeAdminModal($('#qrModal'));
  }

  function copyQRLink() {
    const input = $('#qrLinkInput');
    const feedback = $('#qrFeedback');
    const doCopy = () => {
      input.select();
      document.execCommand('copy');
      feedback.hidden = false;
      setTimeout(() => { feedback.hidden = true; }, 2000);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(input.value).then(() => {
        feedback.hidden = false;
        setTimeout(() => { feedback.hidden = true; }, 2000);
      }).catch(doCopy);
    } else {
      doCopy();
    }
  }

  function downloadQR() {
    const svg = $('#qrCanvas').querySelector('svg');
    if (!svg) return;
    const raw = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([raw], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-qr-' + (pendingQRProductId || 'product') + '.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('تم تحميل QR Code', 'success');
  }

  function setupQR() {
    $('#qrCloseBtn').addEventListener('click', closeQRModal);
    $('#qrModal').addEventListener('click', (e) => {
      if (e.target === $('#qrModal')) closeQRModal();
    });
    $('#qrCopyLinkBtn').addEventListener('click', copyQRLink);
    $('#qrDownloadBtn').addEventListener('click', downloadQR);
  }

  /* --- Quick copy product link --- */
  function copyProductLink(productId) {
    const product = DataStore.getProductById(productId);
    if (!product) return;
    const url = ProductManager.getProductUrl(productId);
    const doCopy = () => {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast('تم نسخ رابط المنتج', 'success');
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => toast('تم نسخ رابط المنتج', 'success')).catch(doCopy);
    } else {
      doCopy();
    }
  }

  /* --- Delete --- */
  function openDeleteModal(productId) {
    const product = DataStore.getProductById(productId);
    if (!product) return;

    pendingDeleteId = productId;
    const name = getLocalizedText(product.name);
    $('#deleteModalText').textContent = 'هل أنت متأكد من حذف هذا المنتج؟';
    $('#deleteModalSubtext').textContent = name + ' — ' + product.sku;
    openAdminModal($('#deleteModal'));
  }

  function closeDeleteModal() {
    pendingDeleteId = null;
    closeAdminModal($('#deleteModal'));
  }

  /* ----------------------------------------------------------
     CATEGORIES (read-only display in admin)
     ---------------------------------------------------------- */
  function renderAdminCategories() {
    const grid = $('#adminCategoriesGrid');
    const allProducts = DataStore.getProducts();

    grid.innerHTML = DataStore.getCategories().map(cat => {
      const name = getLocalizedText(cat.name);
      const desc = getLocalizedText(cat.description);
      const count = allProducts.filter(p => p.category === cat.id).length;
      return '<div class="category-item">' +
        '<div class="category-item__header"><div class="category-item__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div><span class="category-item__name">' + escapeHtml(name) + '</span></div>' +
        '<p class="category-item__count">' + count + ' منتج — ' + escapeHtml(desc) + '</p>' +
      '</div>';
    }).join('');
  }

  /* ----------------------------------------------------------
     SETTINGS — Export / Import
     ---------------------------------------------------------- */
  function setupSettings() {
    $('#exportDataBtn').addEventListener('click', () => {
      const json = DataStore.exportJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products-' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
      URL.revokeObjectURL(url);
      toast('تم التصدير بنجاح', 'success');
    });

    $('#importDataInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          await DataStore.importJSON(ev.target.result);
          toast('تم الاستيراد بنجاح — ' + DataStore.getProducts().length + ' منتج', 'success');
          renderDashboard();
          renderProductsTable();
        } catch (err) {
          toast(err.message || 'خطأ في استيراد الملف', 'error');
        }
      };
      reader.readAsText(file);
    });

    $('#settingsThemeToggle').addEventListener('click', () => {
      toggleTheme();
    });
  }

  /* ----------------------------------------------------------
     THEME
     ---------------------------------------------------------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    localStorage.setItem('adminTheme', theme);
  }

  function toggleTheme() {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  function setupThemeToggle() {
    $('#themeToggle').addEventListener('click', toggleTheme);
  }

  /* ----------------------------------------------------------
     LANGUAGE (admin is Arabic-focused, toggle label only)
     ---------------------------------------------------------- */
  function setupLangToggle() {
    $('#langToggle').addEventListener('click', () => {
      currentLang = currentLang === 'ar' ? 'en' : 'ar';
      document.documentElement.lang = currentLang;
      document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
      const langLabel = document.querySelector('.lang-label');
      if (langLabel) langLabel.textContent = currentLang === 'ar' ? 'EN' : 'عربي';

      if (currentLang === 'ar') {
        document.documentElement.style.setProperty('--font-body', 'var(--font-ar)');
      } else {
        document.documentElement.style.setProperty('--font-body', 'var(--font-en)');
      }

      renderProductsTable();
      renderDashboard();
    });
  }

  /* ----------------------------------------------------------
     SIDEBAR
     ---------------------------------------------------------- */
  function setupSidebar() {
    $$('.sidebar__link[data-view]').forEach(link => {
      link.addEventListener('click', () => {
        switchView(link.dataset.view);
        closeSidebarMobile();
      });
    });

    $$('.btn[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        editingProductId = null;
        switchView(btn.dataset.view);
      });
    });

    $('#sidebarToggle').addEventListener('click', toggleSidebarMobile);
  }

  function toggleSidebarMobile() {
    const sidebar = $('#sidebar');
    const isOpen = sidebar.classList.contains('open');
    sidebar.classList.toggle('open');

    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', closeSidebarMobile);
    }
    overlay.classList.toggle('active', !isOpen);
  }

  function closeSidebarMobile() {
    $('#sidebar').classList.remove('open');
    document.querySelector('.sidebar-overlay')?.classList.remove('active');
  }

  /* ----------------------------------------------------------
     MODAL EVENTS
     ---------------------------------------------------------- */
  function setupModals() {
    $('#previewCloseBtn').addEventListener('click', closePreviewModal);
    $('#previewModal').addEventListener('click', (e) => {
      if (e.target === $('#previewModal')) closePreviewModal();
    });

    $('#deleteCancelBtn').addEventListener('click', closeDeleteModal);
    $('#deleteConfirmBtn').addEventListener('click', async () => {
      if (!pendingDeleteId) return;
      const confirmBtn = $('#deleteConfirmBtn');
      const originalText = confirmBtn.textContent;
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'جاري الحذف...';
      try {
        await DataStore.deleteProduct(pendingDeleteId);
        toast('تم حذف المنتج', 'success');
        closeDeleteModal();
        renderProductsTable();
        renderDashboard();
      } catch (err) {
        toast(err.message || 'فشل الحذف', 'error');
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
      }
    });
    $('#deleteModal').addEventListener('click', (e) => {
      if (e.target === $('#deleteModal')) closeDeleteModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closePreviewModal();
        closeDeleteModal();
        closeQRModal();
      }
    });
  }

  /* ----------------------------------------------------------
     PRODUCT FORM SEARCH & FILTER
     ---------------------------------------------------------- */
  function setupProductFilters() {
    const searchInput = $('#adminSearchInput');
    const catFilter = $('#adminCategoryFilter');

    if (catFilter) {
      catFilter.innerHTML = '<option value="all">جميع التصنيفات</option>';
      DataStore.getCategories().forEach(cat => {
        catFilter.innerHTML += '<option value="' + escapeHtml(cat.id) + '">' + escapeHtml(getLocalizedText(cat.name)) + '</option>';
      });
    }

    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => renderProductsTable(), 250);
      });
    }

    if (catFilter) {
      catFilter.addEventListener('change', () => renderProductsTable());
    }
  }

  /* ----------------------------------------------------------
     POPULATE FORM CATEGORY SELECT
     ---------------------------------------------------------- */
  function populateFormCategories() {
    const select = $('#formCategory');
    select.innerHTML = '<option value="">اختر التصنيف</option>';
    DataStore.getCategories().forEach(cat => {
      select.innerHTML += '<option value="' + escapeHtml(cat.id) + '">' + escapeHtml(getLocalizedText(cat.name)) + '</option>';
    });
  }

  /* ----------------------------------------------------------
     LOGOUT
     ---------------------------------------------------------- */
  function setupLogout() {
    $('#logoutBtn').addEventListener('click', showLoginScreen);
  }

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */
  async function init() {
    applyTheme(currentTheme);

    // Load catalog in the background; a failure here must never block
    // the login screen from working.
    DataStore.load().catch((err) => {
      console.error('Initial catalog load failed:', err);
    });

    setupLogin();
    setupSidebar();
    setupThemeToggle();
    setupLangToggle();
    setupLogout();
    setupModals();
    setupQR();
    setupImageUpload();
    setupProductForm();
    setupSettings();
    populateFormCategories();
    setupProductFilters();

    // Re-render after small delay to ensure DOM ready
    setTimeout(() => {
      if (isLoggedIn) showAdminShell();
    }, 0);
  }

  document.addEventListener('DOMContentLoaded', init);

})();
