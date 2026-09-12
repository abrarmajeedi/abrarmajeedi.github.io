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

  // Play publication videos on hover.
  document.querySelectorAll('.pub-video').forEach(function (video) {
    var parent = video.closest('.pub-media');
    parent.addEventListener('mouseenter', function () { video.play(); });
    parent.addEventListener('mouseleave', function () {
      video.pause();
      video.currentTime = 0;
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
