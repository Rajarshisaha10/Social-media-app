// gather — calm interactions
document.addEventListener('DOMContentLoaded', () => {
  // 1. Navigation scroll state
  const nav = document.getElementById('nav');
  const handleScroll = () => {
    if (!nav) return;
    if (window.scrollY > 20) {
      nav.classList.add('is-scrolled');
    } else {
      nav.classList.remove('is-scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // 2. Mobile navigation toggle
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.classList.toggle('is-open');
      navMenu.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking link
    navMenu.querySelectorAll('.nav__link').forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('is-open');
        navMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 3. Tab switching & Glider animation
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');
  const glider = document.getElementById('tabGlider');

  function updateGlider(activeTab) {
    if (!glider || !activeTab) return;
    glider.style.width = `${activeTab.offsetWidth}px`;
    glider.style.transform = `translateX(${activeTab.offsetLeft - 4}px)`;
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('tab--active'));
      tab.classList.add('tab--active');

      const target = tab.getAttribute('data-tab');
      panels.forEach((p) => {
        if (p.getAttribute('data-panel') === target) {
          p.classList.add('tab-panel--active');
        } else {
          p.classList.remove('tab-panel--active');
        }
      });

      updateGlider(tab);
    });
  });

  const initialTab = document.querySelector('.tab--active');
  if (initialTab) {
    // Delay slightly to ensure fonts and layouts are calculated
    setTimeout(() => updateGlider(initialTab), 50);
    window.addEventListener('resize', () => {
      const current = document.querySelector('.tab--active');
      if (current) updateGlider(current);
    });
  }

  // 4. Counter animation
  const counter = document.getElementById('counter');
  if (counter) {
    const target = parseInt(counter.getAttribute('data-target') || '2412', 10);
    let start = 0;
    const duration = 1800;
    const stepTime = 16;
    const totalSteps = duration / stepTime;
    const increment = target / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        counter.textContent = target.toLocaleString();
        clearInterval(timer);
      } else {
        counter.textContent = Math.floor(start).toLocaleString();
      }
    }, stepTime);
  }

  // 5. Scroll reveal animation
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = entry.target.getAttribute('data-delay') || '0';
            entry.target.style.setProperty('--d', `${delay}ms`);
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }
});
