/**
 * GROUPE ROGUE — i18n Engine
 * Handles language detection, cookie persistence, DOM injection,
 * and FR↔EN navigation switching.
 *
 * Usage: include this script at the bottom of every page.
 * All text nodes must use data-i18n="key" (never hardcoded).
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     URL MAPPING TABLE — FR slug ↔ EN slug
  ---------------------------------------------------------- */
  const URL_MAP = [
    { fr: '/',              en: '/en/' },
    { fr: '/mouvement/',    en: '/en/movement/' },
    { fr: '/rogues/',       en: '/en/rogues/' },
    { fr: '/memberships/',  en: '/en/memberships/' },
    { fr: '/boutique/',     en: '/en/boutique/' },
    { fr: '/rogueship/',    en: '/en/rogueship/' },
    { fr: '/contact/',      en: '/en/contact/' },
    { fr: '/merci/',        en: '/en/merci/' },
    // Rogue Founder profile pages
    { fr: '/rogues/jenica-poirier/',     en: '/en/rogues/jenica-poirier/' },
    { fr: '/rogues/chrystian-guy/',      en: '/en/rogues/chrystian-guy/' },
    { fr: '/rogues/felix-quenneville/',  en: '/en/rogues/felix-quenneville/' },
    { fr: '/rogues/cindy-huppe/',        en: '/en/rogues/cindy-huppe/' },
  ];

  /* ----------------------------------------------------------
     HELPERS
  ---------------------------------------------------------- */

  /** Read language preference — localStorage first, cookie fallback. */
  function getCookie(name) {
    try {
      const ls = localStorage.getItem(name);
      if (ls) return ls;
    } catch (e) {}
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  /** Persist language preference to both localStorage and cookie. */
  function setCookie(name, value) {
    try { localStorage.setItem(name, value); } catch (e) {}
    const expires = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
  }

  /** Normalise a pathname: ensure trailing slash, lowercase. */
  function normPath(p) {
    p = p.toLowerCase();
    if (!p.endsWith('/')) p += '/';
    return p;
  }

  /** Detect language from navigator.language. Defaults to 'fr'. */
  function detectBrowserLang() {
    const lang = (navigator.language || navigator.userLanguage || 'fr').toLowerCase();
    return lang.startsWith('fr') ? 'fr' : 'en';
  }

  /** Map current pathname to the other language's equivalent. */
  function getEquivalentUrl(currentPath, targetLang) {
    const path = normPath(currentPath);
    if (targetLang === 'en') {
      // Look for FR → EN mapping
      const entry = URL_MAP.find(m => normPath(m.fr) === path);
      if (entry) return entry.en;
      // If already on /en/ subtree, keep it
      if (path.startsWith('/en/')) return path;
      // Fallback: prepend /en/
      return '/en' + path;
    } else {
      // Look for EN → FR mapping
      const entry = URL_MAP.find(m => normPath(m.en) === path);
      if (entry) return entry.fr;
      // Strip /en/ prefix if present
      if (path.startsWith('/en/')) return path.slice(3) || '/';
      return path;
    }
  }

  /** Resolve a dot-notation key in the i18n object. */
  function resolve(obj, key) {
    return key.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : null), obj);
  }

  /* ----------------------------------------------------------
     DOM INJECTION
  ---------------------------------------------------------- */

  function applyTranslations(strings) {
    // data-i18n="key" → textContent
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = resolve(strings, key);
      if (val !== null) el.textContent = val;
    });

    // data-i18n-html="key" → innerHTML (for links / emphasis)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const val = resolve(strings, key);
      if (val !== null) el.innerHTML = val;
    });

    // data-i18n-placeholder="key" → placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = resolve(strings, key);
      if (val !== null) el.setAttribute('placeholder', val);
    });

    // data-i18n-title="key" → title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const val = resolve(strings, key);
      if (val !== null) el.setAttribute('title', val);
    });

    // data-i18n-aria-label="key" → aria-label attribute
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria-label');
      const val = resolve(strings, key);
      if (val !== null) el.setAttribute('aria-label', val);
    });
  }

  function updateDocumentMeta(strings, pageKey) {
    const titleKey = 'meta.' + pageKey + '_title';
    const descKey  = 'meta.' + pageKey + '_description';
    const title = resolve(strings, titleKey);
    const desc  = resolve(strings, descKey);

    if (title) {
      document.title = title;
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', title);
    }
    if (desc) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', desc);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', desc);
    }
  }

  function updateLangSwitcher(currentLang) {
    document.querySelectorAll('[data-lang-switch], [data-lang-btn]').forEach(btn => {
      const btnLang = btn.getAttribute('data-lang-switch') || btn.getAttribute('data-lang-btn');
      btn.classList.toggle('lang-active', btnLang === currentLang);
      btn.setAttribute('aria-pressed', btnLang === currentLang ? 'true' : 'false');
    });

    // Update html[lang]
    document.documentElement.setAttribute('lang', currentLang);
  }

  /* ----------------------------------------------------------
     LANGUAGE SWITCHER CLICK HANDLER
  ---------------------------------------------------------- */

  function bindLangSwitcher() {
    document.querySelectorAll('[data-lang-switch], [data-lang-btn]').forEach(btn => {
      btn.addEventListener('click', function () {
        const targetLang = this.getAttribute('data-lang-switch') || this.getAttribute('data-lang-btn');
        const currentLang = getCookie('rogue_lang') || 'fr';
        if (targetLang === currentLang) return;

        setCookie('rogue_lang', targetLang);
        const targetUrl = getEquivalentUrl(window.location.pathname, targetLang);
        window.location.href = targetUrl;
      });
    });
  }

  /* ----------------------------------------------------------
     AFFILIATION COOKIE — ?ref=ROGUE_SLUG
  ---------------------------------------------------------- */

  function handleAffiliationCookie() {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      // Store affiliate ref for 60 days
      setCookie('rogue_ref', ref);
    }
  }

  /* ----------------------------------------------------------
     MAIN INIT
  ---------------------------------------------------------- */

  async function init() {
    handleAffiliationCookie();

    // 1. Determine language
    let lang = getCookie('rogue_lang');

    if (!lang) {
      // First visit: detect from browser, default to 'fr'
      lang = detectBrowserLang();
      setCookie('rogue_lang', lang);
    }

    const currentPath = normPath(window.location.pathname);
    const onEnPath = currentPath.startsWith('/en/') || currentPath === '/en';

    // 2. Redirect if lang/URL mismatch
    if (lang === 'en' && !onEnPath) {
      // Cookie says EN but we're on a FR URL → redirect to EN
      window.location.href = getEquivalentUrl(currentPath, 'en');
      return;
    }
    if (lang === 'fr' && onEnPath) {
      // Cookie says FR but we're on an EN URL → redirect to FR
      window.location.href = getEquivalentUrl(currentPath, 'fr');
      return;
    }

    // 3. Load the correct JSON
    const jsonPath = document.documentElement.getAttribute('data-i18n-root') || '';
    const jsonUrl  = jsonPath + '/assets/js/i18n/' + lang + '.json';

    let strings;
    try {
      const res = await fetch(jsonUrl);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      strings = await res.json();
    } catch (err) {
      console.error('[ROGUE i18n] Failed to load', jsonUrl, err);
      return;
    }

    // 4. Inject translations
    applyTranslations(strings);

    // 5. Update meta tags
    const pageKey = document.body.getAttribute('data-page');
    if (pageKey) updateDocumentMeta(strings, pageKey);

    // 6. Update lang switcher state
    updateLangSwitcher(lang);

    // 7. Bind switcher click events
    bindLangSwitcher();

    // 8. Expose strings globally for page-specific scripts
    window.ROGUE = window.ROGUE || {};
    window.ROGUE.i18n = strings;
    window.ROGUE.lang = lang;

    // 9. Dispatch ready event for page scripts that depend on translations
    document.dispatchEvent(new CustomEvent('rogue:i18n:ready', { detail: { strings, lang } }));
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
