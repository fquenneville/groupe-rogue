/**
 * GROUPE ROGUE — Stripe Checkout
 * Creates a Checkout session via the serverless API endpoint
 * and redirects the user to Stripe's hosted payment page.
 *
 * Usage:
 *   <button data-checkout-price="price_xxx" data-checkout-mode="payment">
 *     Initier le Protocole d'Accès
 *   </button>
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     AFFILIATION COOKIE HELPER
  ---------------------------------------------------------- */
  function getCookie(name) {
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  /* ----------------------------------------------------------
     CREATE STRIPE CHECKOUT SESSION
  ---------------------------------------------------------- */
  async function initCheckout(priceId, mode, successUrl, cancelUrl) {
    const affiliateId = getCookie('rogue_ref') || null;

    const payload = {
      priceId,
      mode,       // 'payment' or 'subscription'
      successUrl: successUrl || (window.location.origin + '/merci/?session_id={CHECKOUT_SESSION_ID}'),
      cancelUrl:  cancelUrl  || (window.location.href + (window.location.href.includes('?') ? '&' : '?') + 'checkout=cancelled'),
    };

    if (affiliateId) {
      payload.affiliateId = affiliateId;
    }

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Checkout session creation failed: HTTP ' + response.status);
    }

    const data = await response.json();
    if (!data.url) throw new Error('No checkout URL returned');

    window.location.href = data.url;
  }

  /* ----------------------------------------------------------
     BIND CHECKOUT BUTTONS
  ---------------------------------------------------------- */
  function bindCheckoutButtons() {
    document.querySelectorAll('[data-checkout-price]').forEach(btn => {
      btn.addEventListener('click', async function () {
        const priceId    = this.getAttribute('data-checkout-price');
        const mode       = this.getAttribute('data-checkout-mode') || 'payment';
        const successUrl = this.getAttribute('data-checkout-success') || null;
        const cancelUrl  = this.getAttribute('data-checkout-cancel')  || null;

        if (!priceId) {
          console.warn('[ROGUE checkout] Missing data-checkout-price on button');
          return;
        }

        // Loading state
        const originalText = this.textContent;
        this.setAttribute('aria-busy', 'true');
        this.textContent = '…';
        this.disabled = true;

        try {
          await initCheckout(priceId, mode, successUrl, cancelUrl);
        } catch (err) {
          console.error('[ROGUE checkout] Error:', err);

          // Restore button on error
          this.setAttribute('aria-busy', 'false');
          this.textContent = originalText;
          this.disabled = false;

          // Show user-facing error
          const errorEl = document.querySelector('[data-checkout-error]');
          if (errorEl) {
            errorEl.textContent = 'Une erreur est survenue. Veuillez réessayer.';
            errorEl.style.display = 'block';
          }
        }
      });
    });
  }

  /* ----------------------------------------------------------
     MERCI PAGE — Verify session & display details
  ---------------------------------------------------------- */
  async function initMerciPage() {
    const params    = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const statusEl  = document.querySelector('[data-session-status]');

    if (!sessionId || !statusEl) return;

    try {
      const res  = await fetch('/api/verify-session?session_id=' + encodeURIComponent(sessionId));
      const data = await res.json();

      if (data.status === 'complete') {
        // Show product name if available
        const productEl = document.querySelector('[data-session-product]');
        if (productEl && data.productName) {
          productEl.textContent = data.productName;
          productEl.style.display = 'block';
        }
        statusEl.setAttribute('data-session-status', 'complete');
      } else {
        statusEl.setAttribute('data-session-status', 'error');
      }
    } catch (err) {
      console.error('[ROGUE checkout] Session verification failed:', err);
    }
  }

  /* ----------------------------------------------------------
     CLIPBOARD — Copy affiliate link
  ---------------------------------------------------------- */
  function initClipboardButtons() {
    document.querySelectorAll('[data-clipboard]').forEach(btn => {
      btn.addEventListener('click', async function () {
        const target  = this.getAttribute('data-clipboard');
        const textEl  = document.querySelector(target);
        const text    = textEl ? textEl.textContent.trim() : this.getAttribute('data-clipboard-text');

        if (!text) return;

        try {
          await navigator.clipboard.writeText(text);

          const originalText = this.textContent;
          this.textContent   = this.getAttribute('data-clipboard-success') || 'Copié !';

          setTimeout(() => {
            this.textContent = originalText;
          }, 2000);
        } catch (err) {
          console.warn('[ROGUE] Clipboard write failed:', err);
        }
      });
    });
  }

  /* ----------------------------------------------------------
     NAV MOBILE TOGGLE
  ---------------------------------------------------------- */
  function initNavToggle() {
    const hamburger = document.querySelector('.nav__hamburger');
    const drawer    = document.querySelector('.nav__drawer');
    if (!hamburger || !drawer) return;

    hamburger.addEventListener('click', function () {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      drawer.classList.toggle('is-open', !expanded);
      document.body.style.overflow = expanded ? '' : 'hidden';
    });

    // Close on link click
    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.setAttribute('aria-expanded', 'false');
        drawer.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ----------------------------------------------------------
     INIT
  ---------------------------------------------------------- */
  function init() {
    bindCheckoutButtons();
    initClipboardButtons();
    initNavToggle();

    if (document.body.getAttribute('data-page') === 'merci') {
      initMerciPage();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose initCheckout for inline calls
  window.ROGUE = window.ROGUE || {};
  window.ROGUE.initCheckout = initCheckout;

})();
