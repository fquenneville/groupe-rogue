/**
 * GROUPE ROGUE — Filters
 * Client-side filtering for /rogues and /boutique pages.
 * AND logic: a card must match ALL active filters to be shown.
 * No page reload — opacity transition on cards.
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     ROGUES PAGE FILTERS
  ---------------------------------------------------------- */

  function initRogueFilters() {
    const container = document.querySelector('[data-filter-target="rogues"]');
    if (!container) return;

    const cards         = Array.from(container.querySelectorAll('.card-rogue[data-vector]'));
    const vectorBtns    = Array.from(document.querySelectorAll('[data-filter-vector]'));
    const sectorBtns    = Array.from(document.querySelectorAll('[data-filter-sector]'));
    const resetBtns     = Array.from(document.querySelectorAll('[data-filter-reset]'));
    const emptyState    = document.querySelector('[data-empty-state="rogues"]');

    let activeVector = null;  // string or null
    let activeSectors = new Set(); // set of strings (AND logic)

    function applyFilters() {
      let visibleCount = 0;

      cards.forEach(card => {
        const cardVector  = card.getAttribute('data-vector');
        const cardSectors = (card.getAttribute('data-sectors') || '').split(',').map(s => s.trim());

        const vectorMatch  = !activeVector || cardVector === activeVector;
        const sectorMatch  = activeSectors.size === 0 || [...activeSectors].every(s => cardSectors.includes(s));

        const visible = vectorMatch && sectorMatch;
        card.setAttribute('data-hidden', visible ? 'false' : 'true');
        card.style.opacity = visible ? '1' : '0';
        card.style.pointerEvents = visible ? '' : 'none';
        card.style.transition = 'opacity 200ms ease';
        if (visible) visibleCount++;
      });

      // Empty state
      if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
      }
    }

    function updateVectorButtonStates() {
      vectorBtns.forEach(btn => {
        const val = btn.getAttribute('data-filter-vector');
        const isActive = val === activeVector;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    function updateSectorButtonStates() {
      sectorBtns.forEach(btn => {
        const val = btn.getAttribute('data-filter-sector');
        const isActive = activeSectors.has(val);
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    // Vector button click (single-select toggle)
    vectorBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const val = this.getAttribute('data-filter-vector');
        activeVector = activeVector === val ? null : val;
        updateVectorButtonStates();
        applyFilters();
      });
    });

    // Sector button click (multi-select toggle, AND logic)
    sectorBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const val = this.getAttribute('data-filter-sector');
        if (activeSectors.has(val)) {
          activeSectors.delete(val);
        } else {
          activeSectors.add(val);
        }
        updateSectorButtonStates();
        applyFilters();
      });
    });

    // Reset buttons
    resetBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        activeVector = null;
        activeSectors.clear();
        updateVectorButtonStates();
        updateSectorButtonStates();
        applyFilters();
      });
    });

    // Init
    applyFilters();
  }

  /* ----------------------------------------------------------
     BOUTIQUE PAGE FILTERS
  ---------------------------------------------------------- */

  function initBoutiqueFilters() {
    const container = document.querySelector('[data-filter-target="boutique"]');
    if (!container) return;

    const cards       = Array.from(container.querySelectorAll('.card-rf[data-sector]'));
    const sectorBtns  = Array.from(document.querySelectorAll('[data-boutique-filter-sector]'));
    const vectorBtns  = Array.from(document.querySelectorAll('[data-boutique-filter-vector]'));
    const resetBtns   = Array.from(document.querySelectorAll('[data-boutique-filter-reset]'));
    const emptyState  = document.querySelector('[data-empty-state="boutique"]');

    let activeSector = null;
    let activeVector = null;

    function applyFilters() {
      let visibleCount = 0;

      cards.forEach(card => {
        const cardSector = card.getAttribute('data-sector');
        const cardVector = card.getAttribute('data-vector') || '';

        const sectorMatch = !activeSector || cardSector === activeSector;
        const vectorMatch = !activeVector || cardVector === activeVector;

        const visible = sectorMatch && vectorMatch;
        card.setAttribute('data-hidden', visible ? 'false' : 'true');
        card.style.opacity = visible ? '1' : '0';
        card.style.pointerEvents = visible ? '' : 'none';
        card.style.transition = 'opacity 200ms ease';
        if (visible) visibleCount++;
      });

      if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
      }
    }

    function updateSectorBtns() {
      sectorBtns.forEach(btn => {
        const val = btn.getAttribute('data-boutique-filter-sector');
        const active = val === activeSector;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    function updateVectorBtns() {
      vectorBtns.forEach(btn => {
        const val = btn.getAttribute('data-boutique-filter-vector');
        const active = val === activeVector;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    sectorBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const val = this.getAttribute('data-boutique-filter-sector');
        activeSector = activeSector === val ? null : val;
        updateSectorBtns();
        applyFilters();
      });
    });

    vectorBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const val = this.getAttribute('data-boutique-filter-vector');
        activeVector = activeVector === val ? null : val;
        updateVectorBtns();
        applyFilters();
      });
    });

    resetBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        activeSector = null;
        activeVector = null;
        updateSectorBtns();
        updateVectorBtns();
        applyFilters();
      });
    });

    applyFilters();
  }

  /* ----------------------------------------------------------
     CONTACT FORM TABS
  ---------------------------------------------------------- */

  function initContactTabs() {
    const tabs   = Array.from(document.querySelectorAll('.form-tab[data-tab]'));
    const panels = Array.from(document.querySelectorAll('.form-panel[data-panel]'));
    if (!tabs.length) return;

    function switchTab(targetId) {
      tabs.forEach(t => {
        const active = t.getAttribute('data-tab') === targetId;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panels.forEach(p => {
        const active = p.getAttribute('data-panel') === targetId;
        p.classList.toggle('is-active', active);
        p.hidden = !active;
      });
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', function () {
        switchTab(this.getAttribute('data-tab'));
      });
    });

    // Activate first tab by default
    if (tabs.length > 0) {
      switchTab(tabs[0].getAttribute('data-tab'));
    }
  }

  /* ----------------------------------------------------------
     FORM SUBMISSION (Zapier webhook)
  ---------------------------------------------------------- */

  function initForms() {
    document.querySelectorAll('form[data-zapier]').forEach(form => {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn    = form.querySelector('[type="submit"]');
        const successEl    = form.querySelector('.form-success');
        const zapierUrl    = form.getAttribute('data-zapier');
        const formData     = new FormData(form);
        const payload      = Object.fromEntries(formData.entries());

        if (submitBtn) {
          submitBtn.setAttribute('aria-busy', 'true');
          submitBtn.disabled = true;
        }

        try {
          await fetch(zapierUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          form.style.display = 'none';
          if (successEl) {
            successEl.classList.add('is-visible');
          }
        } catch (err) {
          console.error('[ROGUE forms] Submission error', err);
          if (submitBtn) {
            submitBtn.setAttribute('aria-busy', 'false');
            submitBtn.disabled = false;
          }
        }
      });
    });
  }

  /* ----------------------------------------------------------
     INIT
  ---------------------------------------------------------- */

  function init() {
    initRogueFilters();
    initBoutiqueFilters();
    initContactTabs();
    initForms();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
