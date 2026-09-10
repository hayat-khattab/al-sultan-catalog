/* ==========================================================
   product.js — Product Detail Page Controller
   Loads a single product from the shared products.json by ?id
   and renders it. Handles SEO, theming, language, WhatsApp,
   and sharing. Uses ProductManager (single source of truth).
   ========================================================== */

(function () {
  'use strict';

  const translations = {
    ar: {
      company_name: 'شركة السلطان التجارية',
      company_sub: 'AL SULTAN TRADING COMPANY',
      nav_products: 'المنتجات',
      nav_categories: 'التصنيفات',
      nav_about: 'من نحن',
      nav_contact: 'تواصل معنا',
      featured: 'مميز',
      warranty: 'الضمان:',
      after_sales: 'خدمة ما بعد البيع:',
      request_quote: 'اطلب عرض سعر',
      share_product: 'مشاركة المنتج',
      share_product_link: 'مشاركة المنتج',
      copy_link: 'نسخ الرابط',
      copied: 'تم النسخ!',
      product_loading: 'جاري تحميل المنتج...',
      product_notfound: 'المنتج غير موجود',
      product_notfound_msg: 'عذراً، لم يتم العثور على المنتج المطلوب.',
      product_error: 'تعذر تحميل المنتج',
      product_error_msg: 'حدث خطأ أثناء تحميل بيانات المنتج. يرجى المحاولة مرة أخرى.',
      retry: 'إعادة المحاولة',
      back_to_catalog: 'العودة إلى الكتالوج',
      skip_to_content: 'تخطي إلى المحتوى',
      nav_home: 'الرئيسية',
      features: 'الميزات',
      specifications: 'المواصفات',
      product_sku: 'رقم الصنف:',
      footer_links_title: 'روابط سريعة',
      footer_desc: 'الموزع المعتمد لتقنيات OMEGA الطبية — حلول طبية وتقنية متقدمة.',
      footer_copy: '© 2026 شركة السلطان التجارية. جميع الحقوق محفوظة.'
    },
    en: {
      company_name: 'AL SULTAN TRADING',
      company_sub: 'TRADING COMPANY',
      nav_products: 'Products',
      nav_categories: 'Categories',
      nav_about: 'About',
      nav_contact: 'Contact',
      featured: 'Featured',
      warranty: 'Warranty:',
      after_sales: 'After-Sales Service:',
      request_quote: 'Request Quote',
      share_product: 'Share Product',
      share_product_link: 'Share Product',
      copy_link: 'Copy Link',
      copied: 'Copied!',
      product_loading: 'Loading product...',
      product_notfound: 'Product Not Found',
      product_notfound_msg: 'Sorry, the requested product could not be found.',
      product_error: 'Could Not Load Product',
      product_error_msg: 'There was an error loading the product data. Please try again.',
      retry: 'Retry',
      back_to_catalog: 'Back to Catalog',
      skip_to_content: 'Skip to content',
      nav_home: 'Home',
      features: 'Features',
      specifications: 'Specifications',
      product_sku: 'SKU:',
      footer_links_title: 'Quick Links',
      footer_desc: 'Authorized distributor for OMEGA medical technology — advanced medical and technical solutions.',
      footer_copy: '© 2026 AL SULTAN TRADING COMPANY. All rights reserved.'
    }
  };

  let currentLang = localStorage.getItem('lang') || 'ar';
  let currentTheme = localStorage.getItem('theme') || 'dark';
  let currentProduct = null;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    applyTheme(currentTheme);
    applyLang(currentLang);
    setupLangToggle();
    setupThemeToggle();
    setupShare();
    setupWhatsAppFloat();
    setupRetry();

    const id = getParam('id');
    if (!id) {
      showNotFound();
      return;
    }

    showLoading();
    const result = await ProductManager.loadProducts();
    if (!result.ok) {
      showError();
      return;
    }

    currentProduct = ProductManager.getProductById(id);
    if (!currentProduct) {
      showNotFound();
      return;
    }

    renderProduct(currentProduct);
    updateSEO(currentProduct);
  }

  function setupRetry() {
    const btn = document.getElementById('retryProductLoad');
    if (btn) btn.addEventListener('click', () => window.location.reload());
  }

  function getParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  /* --- Theme --- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    localStorage.setItem('theme', theme);
  }

  function setupThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', () => {
      applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
  }

  /* --- Language --- */
  function applyLang(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    currentLang = lang;
    localStorage.setItem('lang', lang);

    const langLabel = document.querySelector('.lang-label');
    if (langLabel) langLabel.textContent = lang === 'ar' ? 'EN' : 'عربي';

    applyTranslations(lang);
  }

  function applyTranslations(lang) {
    const t = translations[lang] || translations.ar;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.textContent = t[key];
    });
  }

  function setupLangToggle() {
    const btn = document.getElementById('langToggle');
    if (btn) btn.addEventListener('click', () => {
      applyLang(currentLang === 'ar' ? 'en' : 'ar');
      if (currentProduct) renderProduct(currentProduct);
    });
  }

  /* --- WhatsApp float --- */
  function setupWhatsAppFloat() {
    const btn = document.getElementById('whatsappFloat');
    if (btn) btn.href = ProductManager.generateDefaultWhatsAppUrl();
  }

  /* --- Share modal --- */
  let shareOpener = null;

  function openShareModal() {
    const modal = document.getElementById('shareModal');
    shareOpener = document.activeElement;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const input = document.getElementById('shareLinkInput');
    if (input) input.focus();
    document.getElementById('copyShareFeedback').hidden = true;

    if (modal.__keyH) modal.removeEventListener('keydown', modal.__keyH);
    modal.__keyH = (e) => {
      if (e.key !== 'Tab') return;
      const items = modal.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    modal.addEventListener('keydown', modal.__keyH);
  }

  function setupShare() {
    const shareBtn = document.getElementById('shareBtn');
    const modal = document.getElementById('shareModal');
    const closeBtn = document.getElementById('shareClose');
    const copyBtn = document.getElementById('copyShareLink');

    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        if (!currentProduct) return;
        document.getElementById('shareLinkInput').value = ProductManager.getLocalProductUrl(currentProduct.id);
        openShareModal();
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeShareModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeShareModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeShareModal();
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const input = document.getElementById('shareLinkInput');
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(input.value);
          } else {
            input.select();
            document.execCommand('copy');
          }
          const fb = document.getElementById('copyShareFeedback');
          fb.hidden = false;
          setTimeout(() => { fb.hidden = true; }, 2000);
        } catch (e) {
          input.select();
          document.execCommand('copy');
          const fb = document.getElementById('copyShareFeedback');
          fb.hidden = false;
          setTimeout(() => { fb.hidden = true; }, 2000);
        }
      });
    }
  }

  function closeShareModal() {
    const modal = document.getElementById('shareModal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (modal.__keyH) {
      modal.removeEventListener('keydown', modal.__keyH);
      modal.__keyH = null;
    }
    if (shareOpener && shareOpener.focus) shareOpener.focus();
    shareOpener = null;
  }

  /* --- Loading / Not-found / Error ---
     Exactly one view state is visible at a time (loading, notfound,
     error, or detail). renderProduct is the only place that shows detail. */
  function setProductViewState(state) {
    const loading = document.getElementById('productLoading');
    const notFound = document.getElementById('productNotFound');
    const error = document.getElementById('productError');
    const detail = document.getElementById('productDetail');
    loading.hidden = state !== 'loading';
    notFound.hidden = state !== 'notfound';
    error.hidden = state !== 'error';
    detail.hidden = state !== 'detail';
  }

  function showLoading() {
    setProductViewState('loading');
  }

  function showNotFound() {
    setProductViewState('notfound');
    if (currentLang !== 'ar') {
      document.documentElement.dir = 'ltr';
    }
  }

  function showError() {
    setProductViewState('error');
  }

  /* --- Render --- */
  function renderProduct(product) {
    setProductViewState('detail');

    const name = ProductManager.getLocalizedText(product.name);
    const desc = ProductManager.getLocalizedText(product.description);
    const cat = ProductManager.getCategoryById(product.category);
    const catName = cat ? ProductManager.getLocalizedText(cat.name) : product.category;
    const lang = currentLang;

    // Breadcrumb
    document.getElementById('crumbProduct').textContent = name;
    const crumbCat = document.getElementById('crumbCategory');
    crumbCat.textContent = catName;
    crumbCat.href = 'index.html#categories';

    // Media
    if (product.image) {
      const img = document.getElementById('detailImage');
      const placeholder = document.getElementById('detailImagePlaceholder');

      // Only replace the valid image with the placeholder if it fails to load.
      img.alt = name;
      img.onerror = function () {
        console.error('[product] image failed to load:', img.getAttribute('src'));
        img.hidden = true;
        placeholder.hidden = false;
      };
      img.onload = function () {
        img.hidden = false;
        placeholder.hidden = true;
      };
      img.src = product.image;
      img.hidden = false;
      placeholder.hidden = true;
    } else {
      document.getElementById('detailImage').hidden = true;
      document.getElementById('detailImagePlaceholder').hidden = false;
    }

    const featured = document.getElementById('detailFeatured');
    featured.hidden = !product.featured;

    // Info
    document.getElementById('detailCategory').textContent = catName;
    document.getElementById('detailBrand').textContent = product.brand || '';
    document.getElementById('detailName').textContent = name;
    document.getElementById('detailSku').textContent = product.sku;
    document.getElementById('detailDesc').textContent = desc;

    // Warranty & after-sales
    const warranty = ProductManager.getLocalizedText(product.warranty);
    const afterSales = ProductManager.getLocalizedText(product.afterSales);
    document.getElementById('detailWarranty').textContent = warranty;
    document.getElementById('detailAfterSales').textContent = afterSales;
    document.getElementById('afterSalesRow').hidden = !afterSales;
    if (!warranty) document.getElementById('warrantyRow').hidden = true;
    else document.getElementById('warrantyRow').hidden = false;

    // Features
    const features = product.features?.[lang] || product.features?.ar || [];
    const featuresSection = document.getElementById('featuresSection');
    if (features.length) {
      featuresSection.hidden = false;
      document.getElementById('detailFeatures').innerHTML = features.map(f => '<li>' + escapeHtml(f) + '</li>').join('');
    } else {
      featuresSection.hidden = true;
    }

    // Specs
    const specs = product.specifications?.[lang] || product.specifications?.ar || [];
    const specsSection = document.getElementById('specsSection');
    if (specs.length) {
      specsSection.hidden = false;
      document.getElementById('detailSpecs').querySelector('tbody').innerHTML =
        specs.map(s => '<tr><td>' + escapeHtml(s.key) + '</td><td>' + escapeHtml(s.value) + '</td></tr>').join('');
    } else {
      specsSection.hidden = true;
    }

    // WhatsApp quote button (includes product URL)
    document.getElementById('detailWhatsappBtn').href = ProductManager.generateProductWhatsAppUrl(product);
  }

  function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  /* --- SEO --- */
  function updateSEO(product) {
    const lang = currentLang;
    const name = ProductManager.getLocalizedText(product.name);
    const desc = ProductManager.getLocalizedText(product.description);
    const url = ProductManager.getProductUrl(product.id);

    document.title = (lang === 'ar' ? name + ' - ' + 'شركة السلطان التجارية' : name + ' - ' + 'AL SULTAN TRADING COMPANY');
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = desc || (lang === 'ar' ? 'تفاصيل منتج طبي' : 'Medical product details');

    const canonical = document.getElementById('canonicalLink');
    if (canonical) canonical.href = url;

    const ogTitle = document.getElementById('ogTitle');
    if (ogTitle) ogTitle.content = name;
    const ogDesc = document.getElementById('ogDescription');
    if (ogDesc) ogDesc.content = desc || '';
    const ogUrl = document.getElementById('ogUrl') || document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = url;

    // Share image: use product image if available, else the brand logo fallback
    const ogImage = document.getElementById('ogImage');
    if (ogImage) ogImage.content = product.image || 'https://alsultan-medical.com/assets/logos/logo.png';

    // Twitter Card mirrors OpenGraph
    const twTitle = document.getElementById('twitterTitle');
    if (twTitle) twTitle.content = name;
    const twDesc = document.getElementById('twitterDescription');
    if (twDesc) twDesc.content = desc || '';
    const twImage = document.getElementById('twitterImage');
    if (twImage) twImage.content = product.image || 'https://alsultan-medical.com/assets/logos/logo.png';
  }

})();
