/* =============================================
   GROUPE ROGUE — Shared JS v2.0
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Mobile nav ----
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.nav-mobile');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
  }

  // ---- FAQ accordion ----
  document.querySelectorAll('.faq-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  // ---- Rogue File detail toggle ----
  document.querySelectorAll('.rf-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.rf-card');
      const detail = card.querySelector('.rf-detail');
      const open = detail.classList.toggle('open');
      btn.textContent = open
        ? (btn.dataset.close || 'Fermer ↑')
        : (btn.dataset.open || 'Voir le détail ↓');
    });
  });

  // ---- Contact tabs ----
  document.querySelectorAll('.contact-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const panel = tab.dataset.panel;
      document.querySelectorAll('.contact-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.contact-form-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const el = document.getElementById(panel);
      if (el) el.classList.add('active');
    });
  });

  // ---- Rogues + Boutique filter ----
  const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.group;
        const val = btn.dataset.filter;
        // Toggle within group
        document.querySelectorAll(`.filter-btn[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
      });
    });
  }

  function applyFilters() {
    const activeVecteur = document.querySelector('.filter-btn[data-group="vecteur"].active')?.dataset.filter || 'all';
    const activeSecteur = document.querySelector('.filter-btn[data-group="secteur"].active')?.dataset.filter || 'all';

    const items = document.querySelectorAll('[data-vecteur], [data-secteur]');
    let visible = 0;
    items.forEach(item => {
      const v = (item.dataset.vecteur || '').split(',');
      const s = (item.dataset.secteur || '').split(',');
      const vMatch = activeVecteur === 'all' || v.includes(activeVecteur);
      const sMatch = activeSecteur === 'all' || s.includes(activeSecteur);
      const show = vMatch && sMatch;
      item.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    const empty = document.querySelector('.empty-state');
    if (empty) empty.style.display = visible === 0 ? 'block' : 'none';
  }

  // ---- Forms (mock submit) ----
  document.querySelectorAll('form[data-form]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const successEl = form.querySelector('.form-success');
      if (successEl) {
        successEl.classList.add('visible');
        form.querySelectorAll('input,textarea,select,button[type=submit]').forEach(el => el.disabled = true);
      }
    });
  });

  // ---- Ops bar animation ----
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.ops-bar[data-width]').forEach(bar => {
          bar.style.width = bar.dataset.width + '%';
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.ops-bandeau').forEach(el => observer.observe(el));

  // ---- Counter animation ----
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.stat-number[data-target]').forEach(el => {
          const target = parseInt(el.dataset.target);
          const suffix = el.dataset.suffix || '';
          let start = 0;
          const step = Math.ceil(target / 30);
          const interval = setInterval(() => {
            start = Math.min(start + step, target);
            el.textContent = start + suffix;
            if (start >= target) clearInterval(interval);
          }, 40);
        });
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stats-row').forEach(el => counterObserver.observe(el));

});
