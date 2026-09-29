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
  var nav = document.querySelector('.nav');
  var deck = document.querySelector('.deck');
  var panels = [].slice.call(document.querySelectorAll('.panel'));
  var navLinks = [].slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  // In-page links outside the nav that open a panel, such as Home's "All news".
  var panelLinks = navLinks.concat([].slice.call(document.querySelectorAll('a.panel-link')));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canScrollSmooth = 'scrollBehavior' in document.documentElement.style;

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

  // Returns whether the deck actually moved, so callers know how to scroll. The
  // deck's height is left entirely to CSS: the active panel is the only one in
  // flow, so the deck is already exactly as tall as it. Animating that height is
  // what made the page unusable, because it changed the length of the document
  // underneath a scroll that was still running.
  function showPanel(next) {
    var current = activePanel();
    if (!next || next === current) return false;

    // Document order sets the direction: a panel further down the page enters
    // from the right, and the one it replaces leaves to the left.
    var forward = panels.indexOf(next) > panels.indexOf(current);

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
    return true;
  }

  // For browsers without `overflow: clip`, where the deck falls back to
  // `overflow: hidden` and so is still scrollable: the browser drags it sideways to
  // reach a parked panel whenever a fragment points into one, which leaves the
  // contents displaced for good. Put it back whenever it moves.
  function anchorDeck() {
    if (!deck) return;
    deck.scrollLeft = 0;
    deck.scrollTop = 0;
  }

  if (deck) deck.addEventListener('scroll', anchorDeck);

  // Lands the section just below the sticky nav, which would otherwise cover it.
  function scrollToSection(el, instant) {
    var top = el.getBoundingClientRect().top + (window.pageYOffset || 0);
    if (nav) top -= nav.getBoundingClientRect().height + 12;
    if (top < 0) top = 0;

    // `behavior` is spelled out rather than left to the stylesheet, which applies
    // smooth scrolling to programmatic scrolls too. After a panel switch the
    // reader should simply be at the top of the new panel; animating the scroll as
    // well as the slide is what read as broken.
    if (canScrollSmooth) {
      window.scrollTo({ top: top, behavior: instant || reduced ? 'auto' : 'smooth' });
    } else {
      window.scrollTo(0, top);
    }
  }

  function markCurrent(hash) {
    navLinks.forEach(function (link) {
      if (link.getAttribute('href') === hash) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  // About and Research are sections of the Home panel rather than panels of their
  // own, so with Home showing this is a plain scroll and the deck never moves.
  function goTo(hash, instant) {
    if (!hash || hash === '#') return false;
    var target = document.querySelector(hash);
    if (!target) return false;

    var switched = showPanel(panelOf(target));
    // Measured after the switch: the panel that just came into flow is what
    // decides where the target sits and how far the document can scroll.
    scrollToSection(target, instant || switched);
    markCurrent(hash);
    return true;
  }

  panelLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      // A parked panel is out of flow, so the browser's own jump would land
      // nowhere. Only take the click over once there is somewhere to take it.
      var hash = link.getAttribute('href');
      if (!goTo(hash)) return;
      event.preventDefault();
      try { history.replaceState(null, '', hash); } catch (e) {}
    });
  });

  // Deep links still work: /#cv opens on that panel. The browser already tried to
  // jump there while the panel was parked, so scroll again now that it is in flow.
  if (!goTo(window.location.hash, true)) markCurrent('#about');

  // The browser's own jump happens before this script runs, so its head start has to
  // be undone by hand once; the listener above catches every later one.
  anchorDeck();

  // Covers the hash being changed from outside the nav, such as by hand.
  window.addEventListener('hashchange', function () {
    goTo(window.location.hash, true);
  });

  // Fade sections in as they enter the viewport.
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
