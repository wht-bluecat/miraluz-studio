// === SEXY SCROLL — Reveal + Stagger + Parallax + Nav Hide ===
(function () {
  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('[data-reveal],[data-stagger]').forEach(function (el) {
      el.classList.add('revealed');
    });
    return;
  }

  // --- Scroll Reveal ---
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('[data-reveal],[data-stagger]').forEach(function (el) {
    revealObserver.observe(el);
  });

  // --- Hero Parallax ---
  var hero = document.querySelector('.hero[data-parallax]');
  if (hero) {
    var heroInner = hero.querySelector('.container');
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          var scrollY = window.pageYOffset;
          var heroH = hero.offsetHeight;
          if (scrollY < heroH) {
            heroInner.style.transform = 'translateY(' + (scrollY * 0.25) + 'px)';
            heroInner.style.opacity = 1 - (scrollY / heroH) * 0.4;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // --- Nav Auto-Hide on Scroll Down, Show on Scroll Up ---
  var nav = document.querySelector('.nav');
  if (nav) {
    var lastScrollY = 0;
    var scrollThreshold = 80;
    window.addEventListener('scroll', function () {
      var currentY = window.pageYOffset;
      if (currentY > scrollThreshold && currentY > lastScrollY) {
        nav.classList.add('nav-hidden');
      } else {
        nav.classList.remove('nav-hidden');
      }
      lastScrollY = currentY;
    }, { passive: true });
  }
})();
