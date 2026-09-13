// Dark-mode toggle. The initial theme is set inline in head.html to avoid a flash.
(function () {
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  // Collapsible News and Publications sections. They ship open so the page works
  // without JavaScript; collapsing them is done here instead.
  var toggles = document.querySelectorAll('.collapse-toggle');

  function setOpen(button, open, animate) {
    var panel = document.getElementById(button.getAttribute('aria-controls'));
    if (!panel || button.getAttribute('aria-expanded') === String(open)) return;
    button.setAttribute('aria-expanded', open ? 'true' : 'false');

    if (!animate) {
      panel.style.height = open ? 'auto' : '0px';
      return;
    }

    // Pin the current height so the transition has a concrete starting point,
    // then hand it the measured target.
    panel.style.height = panel.getBoundingClientRect().height + 'px';
    var target = open ? panel.scrollHeight : 0;

    // Reading a layout property commits that start value. Without the flush both
    // assignments land in one paint and no transition runs.
    void panel.offsetHeight;
    panel.style.height = target + 'px';
  }

  toggles.forEach(function (button) {
    var panel = document.getElementById(button.getAttribute('aria-controls'));
    setOpen(button, false, false);

    button.addEventListener('click', function () {
      setOpen(button, button.getAttribute('aria-expanded') !== 'true', true);
    });

    // Release the fixed height once open, so the panel keeps reflowing as images
    // load or the window resizes.
    if (panel) {
      panel.addEventListener('transitionend', function (event) {
        if (event.propertyName !== 'height') return;
        if (button.getAttribute('aria-expanded') === 'true') panel.style.height = 'auto';
      });
    }
  });

  // A link to a collapsed section should open it, otherwise the jump lands on a
  // heading with nothing under it.
  function openForHash(hash) {
    if (!hash) return;
    var section = document.querySelector(hash);
    if (!section) return;
    var button = section.querySelector('.collapse-toggle');
    if (button) setOpen(button, true, true);
  }

  openForHash(window.location.hash);
  window.addEventListener('hashchange', function () {
    openForHash(window.location.hash);
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function () {
      openForHash(link.getAttribute('href'));
    });
  });

  // Fade sections in as they enter the viewport.
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  targets.forEach(function (el) { observer.observe(el); });
})();
