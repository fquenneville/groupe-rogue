/**
 * GROUPE ROGUE — Counter & Progress Animations
 * IntersectionObserver-based:
 *   1. Stat counters animate from 0 to target on viewport entry
 *   2. Progress bars in StatOps animate to their target width
 */

(function () {
  'use strict';

  if (!('IntersectionObserver' in window)) return;

  /* ----------------------------------------------------------
     EASING
  ---------------------------------------------------------- */
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  /* ----------------------------------------------------------
     ANIMATE NUMBER
  ---------------------------------------------------------- */
  function animateCounter(el, target, duration) {
    const isFloat = String(target).includes('.');
    const start = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutQuart(progress);
      const current  = isFloat
        ? (eased * target).toFixed(1)
        : Math.round(eased * target);

      el.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    }

    requestAnimationFrame(step);
  }

  /* ----------------------------------------------------------
     STAT COUNTERS
     Elements: <span class="stat-counter" data-target="42">0</span>
  ---------------------------------------------------------- */
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el     = entry.target;
        const raw    = el.getAttribute('data-target') || '0';
        const target = parseFloat(raw);

        if (isNaN(target)) return;

        animateCounter(el, target, 1200);
        counterObserver.unobserve(el);
      });
    },
    { threshold: 0.4 }
  );

  document.querySelectorAll('.stat-counter[data-target]').forEach(el => {
    counterObserver.observe(el);
  });

  /* ----------------------------------------------------------
     PROGRESS BARS
     Elements: .stat-ops with .stat-ops__progress-fill[data-progress="72"]
  ---------------------------------------------------------- */
  const progressObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const card = entry.target;
        const fill = card.querySelector('.stat-ops__progress-fill');
        if (!fill) return;

        const pct = parseInt(fill.getAttribute('data-progress') || '0', 10);
        fill.style.setProperty('--progress', pct + '%');
        card.classList.add('is-visible');

        // Also animate the percent label if present
        const pctLabel = card.querySelector('.stat-ops__percent');
        if (pctLabel) {
          animateCounter(pctLabel, pct, 1200);
        }

        progressObserver.unobserve(card);
      });
    },
    { threshold: 0.3 }
  );

  document.querySelectorAll('.stat-ops').forEach(el => {
    progressObserver.observe(el);
  });

  /* ----------------------------------------------------------
     HERO STAGGER FADE-IN
     Adds fade-in--delay-N classes sequentially on page load
  ---------------------------------------------------------- */
  function initHeroStagger() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const targets = hero.querySelectorAll('[data-stagger]');
    targets.forEach((el, i) => {
      el.classList.add('fade-in', 'fade-in--delay-' + Math.min(i + 1, 5));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroStagger);
  } else {
    initHeroStagger();
  }

})();
