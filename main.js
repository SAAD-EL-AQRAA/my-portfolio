const FRAME_COUNT = 240;
const canvas = document.getElementById('scroll-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

const loader = document.getElementById('loader');
const loaderBar = document.getElementById('loader-bar');
const loaderText = document.getElementById('loader-text');

const images = [];
let loadedCount = 0;

let targetFraction = 0;
let currentFraction = 0;
let currentFrameIndex = 0;

function getFrameUrl(index) {
  const frameNumber = String(index + 1).padStart(3, '0');
  return `/frames/ezgif-frame-${frameNumber}.jpg`;
}

function updateCanvasSize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
}

function drawFrame(img) {
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  const imgRatio = iw / ih;
  const canvasRatio = cw / ch;

  let rw, rh, ox, oy;

  if (canvasRatio > imgRatio) {
    rw = cw;
    rh = cw / imgRatio;
    ox = 0;
    oy = (ch - rh) / 2;
  } else {
    rw = ch * imgRatio;
    rh = ch;
    ox = (cw - rw) / 2;
    oy = 0;
  }

  ctx.fillStyle = '#090a0f';
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, ox, oy, rw, rh);
}

function getNearestLoadedImage(targetIndex) {
  if (images[targetIndex] && images[targetIndex].complete) {
    return images[targetIndex];
  }

  for (let offset = 1; offset < FRAME_COUNT; offset++) {
    const prev = targetIndex - offset;
    if (prev >= 0 && images[prev] && images[prev].complete) {
      return images[prev];
    }
    const next = targetIndex + offset;
    if (next < FRAME_COUNT && images[next] && images[next].complete) {
      return images[next];
    }
  }
  return null;
}

function hideLoader() {
  if (loader && !loader.classList.contains('loaded')) {
    loader.classList.add('loaded');
  }
}

function preloadImages() {
  setTimeout(hideLoader, 1500);

  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.src = getFrameUrl(i);

    img.onload = () => {
      loadedCount++;
      const progress = Math.round((loadedCount / FRAME_COUNT) * 100);

      if (loaderBar) loaderBar.style.width = `${progress}%`;
      if (loaderText) loaderText.textContent = `Loading ${progress}%`;

      if (i === 0) {
        drawFrame(img);
      }

      if (loadedCount === FRAME_COUNT) {
        hideLoader();
      }
    };

    img.onerror = () => {
      loadedCount++;
      if (loadedCount === FRAME_COUNT) {
        hideLoader();
      }
    };

    images.push(img);
  }
}

function getScrollFraction() {
  const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  const docHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
    window.innerHeight
  );
  const maxScroll = docHeight - window.innerHeight;
  return maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;
}

function renderLoop() {
  targetFraction = getScrollFraction();

  currentFraction += (targetFraction - currentFraction) * 0.1;

  if (Math.abs(targetFraction - currentFraction) < 0.0001) {
    currentFraction = targetFraction;
  }

  const rawIndex = currentFraction * (FRAME_COUNT - 1);
  const targetIndex = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(rawIndex)));

  currentFrameIndex = targetIndex;
  const imgToDraw = getNearestLoadedImage(currentFrameIndex);
  if (imgToDraw) {
    drawFrame(imgToDraw);
  }

  requestAnimationFrame(renderLoop);
}

function initSkillsFilter() {
  const filterBtns = document.querySelectorAll('.skills-filter-tabs .tab-btn');
  const skillCards = document.querySelectorAll('.skills-progress-grid .skill-bar-card');

  if (!filterBtns.length || !skillCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      skillCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'block';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            if (card.style.opacity === '0') {
              card.style.display = 'none';
            }
          }, 200);
        }
      });
    });
  });
}

window.addEventListener('resize', () => {
  updateCanvasSize();
  const imgToDraw = getNearestLoadedImage(currentFrameIndex);
  if (imgToDraw) {
    drawFrame(imgToDraw);
  }
});

window.addEventListener('scroll', () => {
  targetFraction = getScrollFraction();
}, { passive: true });

document.addEventListener('DOMContentLoaded', () => {
  initSkillsFilter();
});

updateCanvasSize();
preloadImages();
initSkillsFilter();
requestAnimationFrame(renderLoop);
