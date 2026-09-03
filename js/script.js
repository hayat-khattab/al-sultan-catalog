/* ==========================================================
   script.js — Main Application Script
   ========================================================== */

(function() {
  'use strict';

  /* --- i18n Translations --- */
  const translations = {
    ar: {
      company_name: 'شركة السلطان التجارية',
      company_sub: 'AL SULTAN TRADING COMPANY',
      nav_home: 'الرئيسية',
      nav_products: 'المنتجات',
      nav_categories: 'التصنيفات',
      nav_about: 'من نحن',
      nav_services: 'خدماتنا',
      nav_contact: 'تواصل معنا',
      hero_badge: 'الموزع المعتمد — OMEGA Technology',
      hero_title_main: 'كتالوج مندوب مبيعات',
      hero_title_sub: 'شركة الإحسان التجارية',
      hero_tagline: 'حلول طبية وتقنية متقدمة من مصادر موثوقة',
      hero_description: 'نقدم مجموعة مختارة من الأجهزة والتجهيزات الطبية والتجميلية والمستلزمات الطبية مع خدمات الدعم الفني وما بعد البيع.',
      hero_cta_products: 'تصفح المنتجات',
      hero_cta_whatsapp: 'تواصل معنا عبر WhatsApp',
      hero_stat_products: 'منتج',
      hero_stat_categories: 'تصنيف',
      hero_stat_brand: 'علامة تجارية',
      categories_title: 'التصنيفات',
      categories_subtitle: 'تصفح منتجاتنا حسب التصنيف',
      products_title: 'المنتجات',
      products_subtitle: 'اكتشف مجموعتنا المختارة من الأجهزة والمعدات الطبية',
      search_placeholder: 'بحث عن منتج، علامة تجارية، أو رقم صنف...',
      filter_all_categories: 'جميع التصنيفات',
      filter_all_brands: 'جميع العلامات',
      filter_featured_only: 'المميزة فقط',
      sort_featured: 'المميزة',
      sort_newest: 'الأحدث',
      sort_alpha: 'أبجدي',
      no_results: 'لا توجد نتائج مطابقة لبحثك',
      no_products: 'لا توجد منتجات في الكتالوج حالياً',
      skip_to_content: 'تخطي إلى المحتوى',
      load_error: 'حدث خطأ أثناء تحميل المنتجات. يرجى المحاولة مرة أخرى.',
      retry: 'إعادة المحاولة',
      products_loading: 'جاري تحميل المنتجات...',
      featured: 'مميز',
      features: 'الميزات',
      specifications: 'المواصفات',
      warranty: 'الضمان:',
      after_sales: 'خدمة ما بعد البيع:',
      request_quote: 'اطلب عرض سعر',
      whatsapp_inquiry: 'استفسار عبر WhatsApp',
      view_details: 'عرض التفاصيل',
      quote_title: 'طلب عرض سعر',
      quote_name_label: 'الاسم الكامل *',
      quote_phone_label: 'رقم التواصل *',
      quote_email_label: 'البريد الإلكتروني',
      quote_message_label: 'رسالتك',
      quote_submit: 'إرسال الطلب عبر WhatsApp',
      quote_name_ph: 'أدخل اسمك الكامل',
      close: 'إغلاق',
      products_count: 'منتج',
      /* Filter / sort / UI aria labels */
      filter_category: 'تصفية حسب التصنيف',
      sort_products: 'ترتيب المنتجات',
      lang_switch: 'تغيير اللغة',
      theme_toggle: 'تبديل المظهر',
      menu_toggle: 'فتح القائمة',
      /* About */
      about_title: 'من نحن',
      about_p1: 'شركة السلطان التجارية هي الموزع المعتمد لشركة OMEGA Technology for Life في تركيا. نحن متخصصون في توريد وبيع الأجهزة والتجهيزات الطبية والتجميلية عالية الجودة.',
      about_p2: 'نلتزم بأعلى معايير الجودة الدولية ونقدم لعملائنا من المستشفيات والعيادات والمتخصصين في الرعاية الصحية أفضل الحلول التقنية الطبية.',
      about_omega: 'Technology for Life',
      about_partner: 'شريكنا التقني الحصري',
      about_f1_title: 'جودة معتمدة',
      about_f1_desc: 'معايير دولية مضمونة',
      about_f2_title: 'ضمان شامل',
      about_f2_desc: 'خدمات دعم فني متواصلة',
      about_f3_title: 'شحن سريع',
      about_f3_desc: 'توصيل إلى جميع المناطق',
      /* Services */
      services_title: 'خدماتنا',
      services_subtitle: 'خدمات متكاملة ترافقك من الشراء إلى الاستخدام',
      service1_title: 'استشارات تقنية',
      service1_desc: 'نساعدك في اختيار الجهاز المناسب لاحتياجاتك مع استشارة مجانية من متخصصين.',
      service2_title: 'التدريب والتأهيل',
      service2_desc: 'تدريب فريقك على تشغيل الأجهزة واستخدامها بشكل صحيح لتحقيق أفضل النتائج.',
      service3_title: 'الصيانة والدعم',
      service3_desc: 'خدمة صيانة دورية ودعم فني على مدار الساعة لضمان عمل الأجهزة بكفاءة.',
      service4_title: 'الضمان والقطع',
      service4_desc: 'قطع غيار أصلية وضمان شامل على جميع الأجهزة والمنتجات الموردة.',
      /* Trust */
      trust_title: 'لماذا تختارنا؟',
      trust_subtitle: 'نلتزم بأعلى معايير الجودة والاحترافية',
      trust1_title: 'موزع معتمد',
      trust1_desc: 'موزع رسمي وحصري لتقنيات OMEGA الطبية في المنطقة.',
      trust2_title: 'جودة أوروبية',
      trust2_desc: 'جميع المنتجات مصنعة في تركيا بمعايير CE و ISO.',
      trust3_title: 'دعم ما بعد البيع',
      trust3_desc: 'خدمات صيانة ودعم فني مستمرة لراحتك.',
      trust4_title: 'خبرة واسعة',
      trust4_desc: 'فريق متخصص من المهندسين والتقنيين ذوي الخبرة.',
      /* Contact */
      contact_title: 'تواصل معنا',
      contact_subtitle: 'نسعد بتواصلكم معنا لأي استفسار أو طلب',
      contact_phone_title: 'الهاتف',
      contact_phone: '+963 994 683 406',
      contact_whatsapp_title: 'WhatsApp',
      contact_whatsapp: 'راسلنا على WhatsApp',
      contact_hours_title: 'ساعات العمل',
      contact_hours: 'الأحد - الخميس: 8:00 ص - 5:00 م',
      contact_cta_title: 'اطلب عرض سعر الآن',
      contact_cta_desc: 'تواصل معنا عبر WhatsApp للحصول على عرض سعر سريع ومُلائم.',
      contact_cta_btn: 'تواصل عبر WhatsApp',
      /* Footer */
      footer_links_title: 'روابط سريعة',
      footer_desc: 'الموزع المعتمد لتقنيات OMEGA الطبية — حلول طبية وتقنية متقدمة.',
      footer_contact_title: 'تواصل معنا',
      footer_copy: '\u00A9 2026 شركة السلطان التجارية. جميع الحقوق محفوظة.',
      category_all: 'الكل'
    },
    en: {
      company_name: 'AL SULTAN TRADING',
      company_sub: 'TRADING COMPANY',
      nav_home: 'Home',
      nav_products: 'Products',
      nav_categories: 'Categories',
      nav_about: 'About',
      nav_services: 'Services',
      nav_contact: 'Contact',
      hero_badge: 'AUTHORIZED DISTRIBUTOR — OMEGA Technology',
      hero_title_main: 'Sales Representative Catalog',
      hero_title_sub: 'AL SULTAN TRADING COMPANY',
      hero_tagline: 'Advanced medical and technical solutions from trusted sources',
      hero_description: 'We offer a curated selection of medical and aesthetic devices and supplies with technical support and after-sales services.',
      hero_cta_products: 'Browse Products',
      hero_cta_whatsapp: 'Contact via WhatsApp',
      hero_stat_products: 'Products',
      hero_stat_categories: 'Categories',
      hero_stat_brand: 'Brand',
      categories_title: 'Categories',
      categories_subtitle: 'Browse our products by category',
      products_title: 'Products',
      products_subtitle: 'Discover our curated collection of medical devices and equipment',
      search_placeholder: 'Search product, brand, or SKU...',
      filter_all_categories: 'All Categories',
      filter_all_brands: 'All Brands',
      filter_featured_only: 'Featured only',
      filter_category: 'Filter by category',
      sort_featured: 'Featured',
      sort_newest: 'Newest',
      sort_alpha: 'Alphabetical',
      sort_products: 'Sort products',
      no_results: 'No matching results found',
      no_products: 'There are no products in the catalog yet',
      skip_to_content: 'Skip to content',
      load_error: 'An error occurred while loading products. Please try again.',
      retry: 'Retry',
      products_loading: 'Loading products...',
      products_count: 'products',
      featured: 'Featured',
      features: 'Features',
      specifications: 'Specifications',
      warranty: 'Warranty:',
      after_sales: 'After-Sales Service:',
      request_quote: 'Request Quote',
      whatsapp_inquiry: 'WhatsApp Inquiry',
      view_details: 'View Details',
      close: 'Close',
      quote_title: 'Request a Quotation',
      quote_name_label: 'Full Name *',
      quote_phone_label: 'Phone Number *',
      quote_email_label: 'Email',
      quote_message_label: 'Your Message',
      quote_submit: 'Send via WhatsApp',
      quote_name_ph: 'Enter your full name',
      about_title: 'About Us',
      about_p1: 'Al Sultan Trading Company is the authorized distributor for OMEGA Technology for Life in Turkey. We specialize in supplying and selling high-quality medical and aesthetic devices and equipment.',
      about_p2: 'We are committed to the highest international quality standards and provide our clients — hospitals, clinics, and healthcare professionals — with the best medical technical solutions.',
      about_omega: 'Technology for Life',
      about_partner: 'Our Exclusive Technical Partner',
      about_f1_title: 'Certified Quality',
      about_f1_desc: 'Guaranteed International Standards',
      about_f2_title: 'Comprehensive Warranty',
      about_f2_desc: 'Continuous Technical Support',
      about_f3_title: 'Fast Shipping',
      about_f3_desc: 'Delivery to All Regions',
      services_title: 'Our Services',
      services_subtitle: 'Comprehensive services that accompany you from purchase to use',
      service1_title: 'Technical Consultations',
      service1_desc: 'We help you choose the right device for your needs with a free consultation from specialists.',
      service2_title: 'Training & Qualification',
      service2_desc: 'Train your team to operate and use devices correctly for optimal results.',
      service3_title: 'Maintenance & Support',
      service3_desc: 'Periodic maintenance service and 24/7 technical support to ensure devices run efficiently.',
      service4_title: 'Warranty & Spare Parts',
      service4_desc: 'Genuine spare parts and comprehensive warranty on all supplied devices and products.',
      trust_title: 'Why Choose Us?',
      trust_subtitle: 'We are committed to the highest standards of quality and professionalism',
      trust1_title: 'Authorized Distributor',
      trust1_desc: 'Official and exclusive distributor for OMEGA medical technology in the region.',
      trust2_title: 'European Quality',
      trust2_desc: 'All products are manufactured in Turkey with CE and ISO standards.',
      trust3_title: 'After-Sales Support',
      trust3_desc: 'Ongoing maintenance and technical support services for your peace of mind.',
      trust4_title: 'Extensive Experience',
      trust4_desc: 'A specialized team of experienced engineers and technicians.',
      contact_title: 'Contact Us',
      contact_subtitle: 'Feel free to contact us for any inquiry or request',
      contact_phone_title: 'Phone',
      contact_phone: '+963 994 683 406',
      contact_whatsapp_title: 'WhatsApp',
      contact_whatsapp: 'Message us on WhatsApp',
      contact_hours_title: 'Working Hours',
      contact_hours: 'Sunday – Thursday: 8:00 AM – 5:00 PM',
      contact_cta_title: 'Request a Quote Now',
      contact_cta_desc: 'Contact us via WhatsApp for a quick and appropriate quote.',
      contact_cta_btn: 'Contact via WhatsApp',
      footer_links_title: 'Quick Links',
      footer_desc: 'Authorized distributor for OMEGA medical technology — advanced medical and technical solutions.',
      footer_contact_title: 'Contact Us',
      footer_copy: '\u00A9 2026 Al Sultan Trading Company. All rights reserved.',
      category_all: 'All',
      lang_switch: 'Switch language',
      theme_toggle: 'Toggle theme',
      menu_toggle: 'Open menu'
    }
  };

  let currentLang = localStorage.getItem('lang') || 'ar';
  let currentTheme = localStorage.getItem('theme') || 'dark';
  let currentFilters = {
    search: '',
    category: 'all',
    brand: 'all',
    featuredOnly: false,
    sort: 'featured'
  };

  /* --- DOM Ready --- */
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    applyTheme(currentTheme);
    applyLang(currentLang);
    setupThemeToggle();
    setupLangToggle();
    setupMobileMenu();
    setupSmoothScroll();
    setupScrollAnimations();
    setupCounterAnimations();
    setupRetry();

    showLoadingState(true);

    await ProductManager.loadProducts();

    if (ProductManager.didFailToLoad()) {
      showLoadError(true);
      return;
    }

    showLoadingState(false);
    populateCategoryFilter();
    renderCategories();
    renderProducts();
    setupSearch();
    setupFilters();
    setupModalEvents();
    setupQuoteForm();
    setupWhatsAppFloating();
    updateNavActiveState();
  }

  function showLoadingState(show) {
    const loading = document.getElementById('productsLoading');
    const grid = document.getElementById('productsGrid');
    if (loading) loading.hidden = !show;
    if (grid) grid.hidden = !!show;
    document.getElementById('productsEmpty') && (document.getElementById('productsEmpty').hidden = true);
    document.getElementById('productsError') && (document.getElementById('productsError').hidden = true);
  }

  function showLoadError(show) {
    const err = document.getElementById('productsError');
    if (err) err.hidden = !show;
    const grid = document.getElementById('productsGrid');
    if (grid) grid.hidden = !!show;
    document.getElementById('productsEmpty') && (document.getElementById('productsEmpty').hidden = true);
    const loading = document.getElementById('productsLoading');
    if (loading) loading.hidden = true;
  }

  function setupRetry() {
    const btn = document.getElementById('retryLoadBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      btn.disabled = true;
      btn.textContent = '...';
      showLoadingState(true);
      // Force a reload by resetting the ProductManager cache
      ProductManager.resetCache && ProductManager.resetCache();
      // Re-init data-dependent setup
      (async () => {
        const result = await ProductManager.loadProducts();
        showLoadingState(false);
        btn.disabled = false;
        btn.textContent = (translations[currentLang] || translations.ar).retry;
        if (!result.ok) {
          showLoadError(true);
          if (ProductManager.didFailToLoad()) return;
        }
        populateCategoryFilter();
        renderCategories();
        renderProducts();
        setupFilters();
        setupSearch();
      })();
    });
  }

  /* --- Theme --- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    localStorage.setItem('theme', theme);
  }

  function setupThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
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
    if (langLabel) {
      langLabel.textContent = lang === 'ar' ? 'EN' : 'عربي';
    }

    applyTranslations(lang);
  }

  function applyTranslations(lang) {
    const t = translations[lang] || translations.ar;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) {
        el.textContent = t[key];
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (t[key] !== undefined) {
        el.placeholder = t[key];
      }
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      if (t[key] !== undefined) {
        el.setAttribute('aria-label', t[key]);
      }
    });

    document.title = lang === 'ar'
      ? 'شركة السلطان التجارية'
      : 'AL SULTAN TRADING COMPANY';

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = lang === 'ar'
        ? 'شركة السلطان التجارية - الموزع المعتمد لتقنيات OMEGA الطبية في تركيا. أجهزة طبية وتجميلية ومستلزمات طبية عالية الجودة.'
        : 'AL SULTAN TRADING COMPANY - Authorized distributor for OMEGA medical technology. High-quality medical and aesthetic devices.';
    }
  }

  function setupLangToggle() {
    const btn = document.getElementById('langToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      applyLang(currentLang === 'ar' ? 'en' : 'ar');
      renderCategories();
      renderProducts();
      updateFilterOptions();
    });
  }

  /* --- Mobile Menu --- */
  function setupMobileMenu() {
    const menuBtn = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('mobileNavOverlay');

    if (!menuBtn || !mobileNav || !overlay) return;

    function toggleMenu(open) {
      const isOpen = open !== undefined ? open : !mobileNav.classList.contains('active');
      mobileNav.classList.toggle('active', isOpen);
      overlay.classList.toggle('active', isOpen);
      mobileNav.setAttribute('aria-hidden', !isOpen);
      overlay.setAttribute('aria-hidden', !isOpen);
      menuBtn.classList.toggle('active', isOpen);
      menuBtn.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    menuBtn.addEventListener('click', () => toggleMenu());
    overlay.addEventListener('click', () => toggleMenu(false));

    mobileNav.querySelectorAll('.mobile-nav__link').forEach(link => {
      link.addEventListener('click', () => toggleMenu(false));
    });
  }

  /* --- Smooth Scroll --- */
  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* --- Scroll Animations --- */
  function setupScrollAnimations() {
    const elements = document.querySelectorAll('.section__header, .category-card, .product-card, .service-card, .trust-card, .contact__item, .about__feature, .hero__content > *');
    elements.forEach(el => el.classList.add('animate-on-scroll'));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(el => observer.observe(el));
  }

  /* --- Counter Animations --- */
  function setupCounterAnimations() {
    const counters = document.querySelectorAll('[data-count]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-count'), 10);
          animateCounter(el, 0, target, 1500);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
  }

  function animateCounter(el, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + (end - start) * eased);
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  /* --- Navigation Active State --- */
  function updateNavActiveState() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.header__nav-link');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { threshold: 0.3, rootMargin: `-${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height'))}px 0px -50% 0px` });

    sections.forEach(section => observer.observe(section));
  }

  /* --- Helpers --- */
  function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  /* --- Categories --- */
  function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;
    const categories = ProductManager.getCategories();
    const t = translations[currentLang] || translations.ar;

    grid.innerHTML = categories.map(cat => {
      const count = ProductManager.getProducts().filter(p => p.category === cat.id).length;
      const name = ProductManager.getLocalizedText(cat.name);
      const desc = ProductManager.getLocalizedText(cat.description);
      const iconSvg = getCategoryIcon(cat.icon);
      return `
        <div class="category-card" data-category="${escapeHtml(cat.id)}" tabindex="0" role="button" aria-label="${name}">
          <div class="category-card__icon">${iconSvg}</div>
          <h3 class="category-card__name">${escapeHtml(name)}</h3>
          <p class="category-card__desc">${escapeHtml(desc)}</p>
          <span class="category-card__count">${count} ${t.products_count}</span>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.category-card').forEach(card => {
      const handler = () => {
        const catId = card.getAttribute('data-category');
        const isActive = card.classList.contains('active');
        grid.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
        if (isActive) {
          currentFilters.category = 'all';
        } else {
          card.classList.add('active');
          currentFilters.category = catId;
        }
        document.getElementById('categoryFilter').value = currentFilters.category;
        renderProducts();
        document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
      };
      card.addEventListener('click', handler);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handler();
        }
      });
    });
  }

  function getCategoryIcon(icon) {
    const icons = {
      stethoscope: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>',
      sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>',
      shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
      cog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
      gem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 3 18 3 22 9 12 22 2 9 6 3"/><line x1="12" y1="22" x2="12" y2="9"/><line x1="22" y1="9" x2="2" y2="9"/></svg>'
    };
    return icons[icon] || icons.box;
  }

  /* --- Populate Filter Options --- */
  function populateCategoryFilter() {
    const select = document.getElementById('categoryFilter');
    if (!select) return;
    const categories = ProductManager.getCategories();
    select.innerHTML = '<option value="all">' + (translations[currentLang]?.filter_all_categories || 'جميع التصنيفات') + '</option>';
    categories.forEach(cat => {
      const name = ProductManager.getLocalizedText(cat.name);
      select.innerHTML += `<option value="${escapeHtml(cat.id)}">${escapeHtml(name)}</option>`;
    });
  }

  function updateFilterOptions() {
    populateCategoryFilter();
    document.getElementById('categoryFilter').value = currentFilters.category;
  }

  /* --- Products --- */
  function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const empty = document.getElementById('productsEmpty');
    if (!grid) return;

    const t = translations[currentLang] || translations.ar;
    const filtered = ProductManager.filterProducts(currentFilters);

    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (empty) {
        const isEmptyCatalog = ProductManager.getProducts().length === 0;
        empty.querySelector('p').textContent = isEmptyCatalog ? t.no_products : t.no_results;
        empty.hidden = false;
      }
      return;
    }

    if (empty) empty.hidden = true;

    grid.innerHTML = filtered.map(product => {
      const name = ProductManager.getLocalizedText(product.name);
      const desc = ProductManager.getLocalizedText(product.description);
      const cat = ProductManager.getCategoryById(product.category);
      const catName = cat ? ProductManager.getLocalizedText(cat.name) : product.category;
      const productUrl = ProductManager.getLocalProductUrl(product.id);
      const imageHtml = product.image
        ? `<img class="product-card__img" src="${escapeHtml(product.image)}" alt="${escapeHtml(name)}" loading="lazy" data-img-placeholder>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
      return `
        <article class="product-card" data-product-id="${escapeHtml(product.id)}">
          <a class="product-card__link" href="${escapeHtml(productUrl)}" aria-label="${escapeHtml(name)} — ${t.view_details}">
            <div class="product-card__image">
              ${product.featured ? `<div class="product-card__badge">${escapeHtml(t.featured)}</div>` : ''}
              ${imageHtml}
            </div>
            <div class="product-card__body">
              <span class="product-card__category">${escapeHtml(catName)}</span>
              <h3 class="product-card__name">${escapeHtml(name)}</h3>
              <span class="product-card__brand">${escapeHtml(product.brand)}</span>
              <span class="product-card__sku">${escapeHtml(product.sku)}</span>
              <p class="product-card__desc">${escapeHtml(desc)}</p>
              <div class="product-card__actions">
                <span class="btn btn--outline product-card__details-btn">${escapeHtml(t.view_details)}</span>
                <span class="btn btn--whatsapp product-card__quote-btn" role="button" tabindex="0">${escapeHtml(t.request_quote)}</span>
              </div>
            </div>
          </a>
        </article>
      `;
    }).join('');

    // Quote buttons open the WhatsApp quote modal (stop propagation to avoid card navigation)
    grid.querySelectorAll('.product-card__quote-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest('.product-card');
        openQuoteModal(card.getAttribute('data-product-id'));
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          const card = btn.closest('.product-card');
          openQuoteModal(card.getAttribute('data-product-id'));
        }
      });
    });

    // Broken-image fallback: swap a failed <img> for the placeholder icon
    grid.querySelectorAll('.product-card__img[data-img-placeholder]').forEach(img => {
      if (img.complete && img.naturalWidth > 0) return;
      img.addEventListener('error', () => {
        if (img.dataset.fallback === '1') return;
        img.dataset.fallback = '1';
        const placeholder = document.createElement('div');
        placeholder.className = 'product-card__img product-card__img--fallback';
        placeholder.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
        img.replaceWith(placeholder);
      });
    });
  }

  /* --- Search --- */
  function setupSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    let debounce;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        currentFilters.search = input.value.trim();
        renderProducts();
      }, 250);
    });
  }

  /* --- Filters --- */
  function setupFilters() {
    const catFilter = document.getElementById('categoryFilter');
    const brandFilter = document.getElementById('brandFilter');
    const sortFilter = document.getElementById('sortFilter');
    const featuredCheck = document.getElementById('featuredOnly');

    if (catFilter) catFilter.addEventListener('change', () => {
      currentFilters.category = catFilter.value;
      renderCategories();
      renderProducts();
    });

    if (brandFilter) brandFilter.addEventListener('change', () => {
      currentFilters.brand = brandFilter.value;
      renderProducts();
    });

    if (sortFilter) sortFilter.addEventListener('change', () => {
      currentFilters.sort = sortFilter.value;
      renderProducts();
    });

    if (featuredCheck) featuredCheck.addEventListener('change', () => {
      currentFilters.featuredOnly = featuredCheck.checked;
      renderProducts();
    });
  }

  /* --- Product Modal --- */
  function setupModalEvents() {
    const productModal = document.getElementById('productModal');
    const quoteModal = document.getElementById('quoteModal');

    document.getElementById('modalClose')?.addEventListener('click', () => closeModal(productModal));
    document.getElementById('quoteModalClose')?.addEventListener('click', () => closeModal(quoteModal));

    if (productModal) {
      productModal.addEventListener('click', (e) => {
        if (e.target === productModal) closeModal(productModal);
      });
    }
    if (quoteModal) {
      quoteModal.addEventListener('click', (e) => {
        if (e.target === quoteModal) closeModal(quoteModal);
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal(productModal);
        closeModal(quoteModal);
      }
    });
  }

  const lastFocused = { modal: null, el: null };

  function getFocusable(modal) {
    return modal.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]');
  }

  function openModal(modal) {
    if (!modal) return;
    lastFocused.modal = modal;
    lastFocused.el = document.activeElement;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const focusable = getFocusable(modal);
    if (focusable.length) focusable[0].focus();

    // Trap focus inside the modal
    if (modal.__keyH) modal.removeEventListener('keydown', modal.__keyH);
    modal.__keyH = (e) => {
      if (e.key !== 'Tab') return;
      const items = getFocusable(modal);
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

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (modal.__keyH) {
      modal.removeEventListener('keydown', modal.__keyH);
      modal.__keyH = null;
    }
    // Restore focus to the element that opened the modal
    if (lastFocused.modal === modal && lastFocused.el && lastFocused.el.focus) {
      lastFocused.el.focus();
    }
    lastFocused.modal = null;
    lastFocused.el = null;
  }

  function openProductModal(productId) {
    const product = ProductManager.getProductById(productId);
    if (!product) return;

    const t = translations[currentLang] || translations.ar;
    const lang = currentLang;
    const name = ProductManager.getLocalizedText(product.name);
    const desc = ProductManager.getLocalizedText(product.description);
    const features = product.features?.[lang] || product.features?.ar || [];
    const specs = product.specifications?.[lang] || product.specifications?.ar || [];
    const warranty = ProductManager.getLocalizedText(product.warranty);
    const afterSales = ProductManager.getLocalizedText(product.afterSales);

    document.getElementById('modalTitle').textContent = name;
    document.getElementById('modalBrand').textContent = product.brand;
    document.getElementById('modalSku').textContent = product.sku;
    document.getElementById('modalDescription').textContent = desc;

    const badge = document.getElementById('modalBadge');
    badge.hidden = !product.featured;

    const featuresList = document.getElementById('modalFeatures');
    featuresList.innerHTML = features.map(f => `<li>${escapeHtml(f)}</li>`).join('');

    const specsTable = document.getElementById('modalSpecs').querySelector('tbody');
    specsTable.innerHTML = specs.map(s => `<tr><td>${escapeHtml(s.key)}</td><td>${escapeHtml(s.value)}</td></tr>`).join('');

    document.getElementById('modalWarranty').textContent = warranty;
    document.getElementById('modalAfterSales').textContent = afterSales;

    const whatsappBtn = document.getElementById('modalWhatsappBtn');
    whatsappBtn.href = ProductManager.generateProductWhatsAppUrl(product);

    const quoteBtn = document.getElementById('modalQuoteBtn');
    quoteBtn.onclick = () => {
      closeModal(document.getElementById('productModal'));
      setTimeout(() => openQuoteModal(productId), 300);
    };

    openModal(document.getElementById('productModal'));
  }

  /* --- Quote Modal --- */
  function openQuoteModal(productId) {
    const product = ProductManager.getProductById(productId);
    if (!product) return;

    const name = ProductManager.getLocalizedText(product.name);
    document.getElementById('quoteProductName').textContent = `${product.brand} — ${name}`;
    document.getElementById('quoteProductName').setAttribute('data-product-id', productId);
    document.getElementById('quoteForm').reset();
    openModal(document.getElementById('quoteModal'));
  }

  function setupQuoteForm() {
    const form = document.getElementById('quoteForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('quoteName');
      const phoneInput = document.getElementById('quotePhone');
      const emailInput = document.getElementById('quoteEmail');
      const messageInput = document.getElementById('quoteMessage');

      nameInput.classList.remove('error');
      phoneInput.classList.remove('error');

      let valid = true;
      if (!nameInput.value.trim()) {
        nameInput.classList.add('error');
        valid = false;
      }
      if (!phoneInput.value.trim()) {
        phoneInput.classList.add('error');
        valid = false;
      }
      if (!valid) return;

      const productId = document.getElementById('quoteProductName').getAttribute('data-product-id');
      const product = ProductManager.getProductById(productId);
      if (!product) return;

      const customerInfo = {
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        email: emailInput.value.trim(),
        message: messageInput.value.trim()
      };

      const message = ProductManager.generateQuotationMessage(product, customerInfo);
      const url = ProductManager.getWhatsAppUrl(message);
      window.open(url, '_blank', 'noopener,noreferrer');

      closeModal(document.getElementById('quoteModal'));
    });
  }

  /* --- WhatsApp Floating --- */
  function setupWhatsAppFloating() {
    const btn = document.getElementById('whatsappFloat');
    if (!btn) return;
    btn.href = ProductManager.generateDefaultWhatsAppUrl();
  }

})();
