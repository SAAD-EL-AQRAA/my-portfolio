/* ====================================================
   SAAD EL-AQRAA — Portfolio · main.js
   Canvas scroll animation + portfolio interactions
   ==================================================== */

// ─────────────────────────────────────────────────────
// 1. CANVAS FRAME ANIMATION
// ─────────────────────────────────────────────────────
const FRAME_COUNT = 240;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: false });

const images = new Array(FRAME_COUNT);
let loadedCount = 0;
let targetProgress = 0;
let currentProgress = 0;
let lastRenderedIndex = -1;

function getFrameUrl(index) {
  const frameNumber = String(index + 1).padStart(3, '0');
  return `/frames/ezgif-frame-${frameNumber}.png`;
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const displayW = window.innerWidth;
  const displayH = window.innerHeight;

  canvas.width = Math.round(displayW * dpr);
  canvas.height = Math.round(displayH * dpr);
  canvas.style.width = `${displayW}px`;
  canvas.style.height = `${displayH}px`;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const indexToDraw = lastRenderedIndex >= 0 ? lastRenderedIndex : 0;
  const img = getLoadedImage(indexToDraw);
  if (img) drawFrame(img);
}

function drawFrame(img) {
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  const imgRatio = iw / ih;
  const canvasRatio = cw / ch;

  let dw, dh, dx, dy;

  if (canvasRatio > imgRatio) {
    dw = cw;
    dh = cw / imgRatio;
    dx = 0;
    dy = (ch - dh) / 2;
  } else {
    dw = ch * imgRatio;
    dh = ch;
    dx = (cw - dw) / 2;
    dy = 0;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
}

function getLoadedImage(targetIndex) {
  if (images[targetIndex] && images[targetIndex].complete && images[targetIndex].naturalWidth > 0) {
    return images[targetIndex];
  }
  for (let offset = 1; offset < FRAME_COUNT; offset++) {
    const prev = targetIndex - offset;
    if (prev >= 0 && images[prev] && images[prev].complete && images[prev].naturalWidth > 0) return images[prev];
    const next = targetIndex + offset;
    if (next < FRAME_COUNT && images[next] && images[next].complete && images[next].naturalWidth > 0) return images[next];
  }
  return null;
}

function preloadFrames() {
  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.src = getFrameUrl(i);

    const onComplete = () => {
      images[i] = img;
      loadedCount++;
      if (i === 0 && lastRenderedIndex === -1) {
        drawFrame(img);
        lastRenderedIndex = 0;
      }
    };

    if ('decode' in img) {
      img.decode().then(onComplete).catch(() => { img.onload = onComplete; });
    } else {
      img.onload = onComplete;
    }
  }
}

// Canvas progress maps to the full page scroll so animation plays everywhere
function getScrollProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return Math.min(1, Math.max(0, scrollTop / maxScroll));
}

function renderLoop() {
  targetProgress = getScrollProgress();
  currentProgress += (targetProgress - currentProgress) * 0.08;
  if (Math.abs(targetProgress - currentProgress) < 0.0001) currentProgress = targetProgress;

  const rawIndex = currentProgress * (FRAME_COUNT - 1);
  const frameIndex = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(rawIndex)));

  if (frameIndex !== lastRenderedIndex) {
    const img = getLoadedImage(frameIndex);
    if (img) {
      drawFrame(img);
      lastRenderedIndex = frameIndex;
    }
  }

  requestAnimationFrame(renderLoop);
}

// ─────────────────────────────────────────────────────
// 2. NAVBAR — scroll effect + active link + mobile menu
// ─────────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const navLinksContainer = document.getElementById('navLinks');
const navToggle = document.getElementById('navToggle');

function updateNavbar() {
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const scrollY = window.scrollY + 120;

  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');

    if (scrollY >= top && scrollY < top + height) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${id}`) {
          link.classList.add('active');
        }
      });
    }
  });
}

// Mobile menu toggle
navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  navLinksContainer.classList.toggle('open');
});

// Close mobile menu on link click
navLinksContainer.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('active');
    navLinksContainer.classList.remove('open');
  });
});

// ─────────────────────────────────────────────────────
// 3. INTERSECTION OBSERVER — fade-in sections
// ─────────────────────────────────────────────────────
const fadeEls = document.querySelectorAll('.fade-in');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger delay based on sibling index
      const siblings = entry.target.parentElement.querySelectorAll('.fade-in');
      let delay = 0;
      siblings.forEach((sib, idx) => {
        if (sib === entry.target) delay = idx * 100;
      });
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -60px 0px'
});

fadeEls.forEach(el => observer.observe(el));

// ─────────────────────────────────────────────────────
// 4. SKILLS — bar animation on scroll
// ─────────────────────────────────────────────────────
const skillItems = document.querySelectorAll('.skill-item');

const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const bar = entry.target.querySelector('.skill-progress');
      if (bar) {
        const width = bar.getAttribute('data-width');
        setTimeout(() => {
          bar.style.width = `${width}%`;
        }, 150);
      }
      skillObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

skillItems.forEach(item => skillObserver.observe(item));

// ─────────────────────────────────────────────────────
// 5. SKILLS FILTER
// ─────────────────────────────────────────────────────
const filterBtns = document.querySelectorAll('.filter-btn');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.getAttribute('data-filter');

    skillItems.forEach(item => {
      const category = item.getAttribute('data-category');
      if (filter === 'all' || category === filter) {
        item.style.display = '';
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
        item.style.display = 'none';
      }
    });
  });
});

// ─────────────────────────────────────────────────────
// 6. CONTACT FORM
// ─────────────────────────────────────────────────────
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const originalHTML = btn.innerHTML;

    btn.innerHTML = '<i class="fas fa-check"></i> Message envoyé !';
    btn.style.background = '#22c55e';
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.background = '';
      btn.disabled = false;
      contactForm.reset();
    }, 3000);
  });
}

// ─────────────────────────────────────────────────────
// 7. SCROLL EVENTS
// ─────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  targetProgress = getScrollProgress();
  updateNavbar();
  updateActiveNav();
}, { passive: true });

window.addEventListener('resize', resizeCanvas, { passive: true });

// ─────────────────────────────────────────────────────
// 8. INIT
// ─────────────────────────────────────────────────────
resizeCanvas();
preloadFrames();
requestAnimationFrame(renderLoop);
updateNavbar();
