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

  // The nav is a slide deck: one panel is in flow at a time and the rest are
  // parked off to the side, so switching slides the page sideways under the nav.
  var deck = document.querySelector('.deck');
  var panels = [].slice.call(document.querySelectorAll('.panel'));
  var navLinks = [].slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));

  function panelOf(el) {
    while (el && el.classList) {
      if (el.classList.contains('panel')) return el;
      el = el.parentNode;
    }
    return null;
  }

  function activePanel() {
    for (var i = 0; i < panels.length; i++) {
      if (panels[i].classList.contains('is-active')) return panels[i];
    }
    return null;
  }

  // Returns whether the deck actually moved, so callers know how to scroll.
  function showPanel(next, animate) {
    var current = activePanel();
    if (!next || next === current) return false;

    // Document order sets the direction: a panel further down the page enters
    // from the right, and the one it replaces leaves to the left.
    var forward = panels.indexOf(next) > panels.indexOf(current);
    var from = deck ? deck.getBoundingClientRect().height : 0;

    // Park the incoming panel on the side it should arrive from and commit that
    // with a layout read, so the slide starts there rather than from wherever the
    // panel happened to be left last time.
    next.style.setProperty('--offset', forward ? '100%' : '-100%');
    void next.offsetWidth;

    if (current) {
      current.style.setProperty('--offset', forward ? '-100%' : '100%');
      current.classList.remove('is-active');
    }
    next.classList.add('is-active');

    if (deck && animate) {
      // `auto` to `auto` cannot be transitioned, so pin the old height, flush it
      // to commit that start value, then hand over the new one. The target is the
      // incoming panel's own height rather than the deck's scrollHeight, which
      // cannot report less than the height just pinned on it.
      deck.style.height = from + 'px';
      void deck.offsetHeight;
      deck.style.height = next.getBoundingClientRect().height + 'px';
    }
    return true;
  }

  // Release the pinned height once the slide is done, so the panel keeps
  // reflowing as images load or the window resizes.
  if (deck) {
    deck.addEventListener('transitionend', function (event) {
      if (event.target === deck && event.propertyName === 'height') {
        deck.style.height = '';
      }
    });
  }

  function markCurrent(hash) {
    navLinks.forEach(function (link) {
      if (link.getAttribute('href') === hash) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var hash = link.getAttribute('href');
      var target = document.querySelector(hash);
      if (!target) return;

      // A parked panel is out of flow, so the browser's own jump would land
      // nowhere. Slide to it instead, then scroll.
      event.preventDefault();
      var moved = showPanel(panelOf(target), true);
      markCurrent(hash);

      // On a move, the top of the deck is where the panel starts. Otherwise the
      // link is pointing at a section of the panel already on screen.
      (moved && deck ? deck : target).scrollIntoView({ block: 'start' });
      try { history.replaceState(null, '', hash); } catch (e) {}
    });
  });

  // Deep links still work: /#cv opens on that panel. The browser already tried to
  // jump there while the panel was parked, so scroll again now that it is in flow.
  if (window.location.hash) {
    var landing = document.querySelector(window.location.hash);
    if (landing) {
      showPanel(panelOf(landing), false);
      markCurrent(window.location.hash);
      landing.scrollIntoView({ block: 'start' });
    }
  } else {
    markCurrent('#about');
  }

  // Covers the hash being changed from outside the nav, such as by hand.
  window.addEventListener('hashchange', function () {
    var target = document.querySelector(window.location.hash);
    if (!target) return;
    showPanel(panelOf(target), true);
    markCurrent(window.location.hash);
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
