/**
 * Homepage atelier: a video-safe hero, smooth pencil canvas and scroll-driven type.
 */
(function () {
  const banner = document.querySelector('#banner');
  if (!banner) return;

  const backgroundImage = banner.style.backgroundImage || window.getComputedStyle(banner).backgroundImage;
  const videoUrl = backgroundImage.match(/^url\(["']?(.+?\.(?:mp4|webm|ogg)(?:\?[^"']*)?)["']?\)$/i)?.[1];

  if (videoUrl && !banner.querySelector('.hero-background-video')) {
    const video = document.createElement('video');
    video.className = 'hero-background-video';
    video.src = videoUrl;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('aria-hidden', 'true');
    Object.assign(video.style, {
      height: '100%',
      inset: '0',
      objectFit: 'cover',
      pointerEvents: 'none',
      position: 'absolute',
      width: '100%',
      zIndex: '0'
    });

    // Fluid's loader expects banner.backgroundImage to remain a valid url(...).
    banner.style.backgroundImage = 'url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==")';
    banner.prepend(video);
  }

  const isHomePage = /^\/(?:index\.html)?$/.test(window.location.pathname);
  if (!isHomePage || document.querySelector('#hero-sketch-canvas')) return;

  const headerInner = banner.closest('.header-inner');
  if (!headerInner) return;

  const story = document.createElement('section');
  story.className = 'hero-story';
  story.setAttribute('aria-label', 'Interactive introduction');
  headerInner.parentNode.insertBefore(story, headerInner);
  story.appendChild(headerInner);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const bannerText = banner.querySelector('.banner-text');
  const scrollArrow = banner.querySelector('.scroll-down-bar');

  const kineticType = document.createElement('div');
  kineticType.className = 'hero-kinetic-type';
  kineticType.setAttribute('aria-hidden', 'true');

  const scenes = [
    {
      text: 'Make what matters.',
      className: 'hero-kinetic-word--wide',
      left: '7vw',
      top: '20vh',
      start: 0.12,
      end: 0.52,
      fromX: -190,
      fromY: 8,
      toX: 110,
      toY: -24,
      rotate: -2
    },
    {
      text: 'Curiosity, in motion.',
      className: 'hero-kinetic-word--display',
      left: '17vw',
      top: '53vh',
      start: 0.31,
      end: 0.78,
      fromX: 210,
      fromY: 72,
      toX: -105,
      toY: -35,
      rotate: 1.5
    },
    {
      text: 'TECHNOLOGY, WITH HUMANITY',
      className: 'hero-kinetic-word--quiet',
      left: '66vw',
      top: '25vh',
      start: 0.48,
      end: 0.93,
      fromX: 145,
      fromY: -80,
      toX: -75,
      toY: 40,
      rotate: 5
    },
    {
      text: 'IDEAS BECOME SYSTEMS',
      className: 'hero-kinetic-word--vertical',
      left: '89vw',
      top: '48vh',
      start: 0.59,
      end: 1.02,
      fromX: 80,
      fromY: 150,
      toX: -40,
      toY: -95,
      rotate: 0
    }
  ];

  scenes.forEach((scene) => {
    const word = document.createElement('span');
    word.className = `hero-kinetic-word ${scene.className}`;
    word.textContent = scene.text;
    word.style.setProperty('--hero-left', scene.left);
    word.style.setProperty('--hero-top', scene.top);
    scene.element = word;
    kineticType.appendChild(word);
  });

  const drawHint = document.createElement('div');
  drawHint.className = 'hero-draw-hint';
  drawHint.setAttribute('aria-hidden', 'true');
  drawHint.textContent = 'Draw with your pointer · Scroll to explore';
  kineticType.appendChild(drawHint);
  banner.appendChild(kineticType);

  const canvas = document.createElement('canvas');
  canvas.id = 'hero-sketch-canvas';
  canvas.className = 'pencil-cursor';
  canvas.setAttribute('aria-label', 'Drawing canvas');
  Object.assign(canvas.style, {
    background: 'transparent',
    display: 'block',
    height: '100%',
    inset: '0',
    pointerEvents: 'auto',
    position: 'absolute',
    touchAction: 'pan-y',
    width: '100%',
    zIndex: '2'
  });
  banner.appendChild(canvas);

  if (bannerText) {
    bannerText.style.pointerEvents = 'none';
  }
  if (scrollArrow) {
    scrollArrow.style.position = 'absolute';
    scrollArrow.style.zIndex = '4';
  }

  const context = canvas.getContext('2d', { alpha: true });
  const strokeColor = 'rgba(255, 248, 235, 0.9)';
  const baseLineWidth = 3;
  let drawing = false;
  let activePointer = null;
  let queuedPoints = [];
  let previousPoint = null;
  let frameRequest = 0;
  let canvasWidth = 0;
  let canvasHeight = 0;

  function applyStrokeStyles() {
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = strokeColor;
    context.lineWidth = baseLineWidth;
  }

  function resizeCanvas() {
    const width = Math.round(banner.clientWidth);
    const height = Math.round(banner.clientHeight);
    if (!width || !height || (width === canvasWidth && height === canvasHeight)) return;

    const snapshot = document.createElement('canvas');
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    if (canvas.width && canvas.height) {
      snapshot.getContext('2d').drawImage(canvas, 0, 0);
    }

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvasWidth = width;
    canvasHeight = height;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    applyStrokeStyles();

    if (snapshot.width && snapshot.height) {
      context.save();
      context.globalAlpha = 0.98;
      context.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, width, height);
      context.restore();
    }
  }

  function getPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const pressure = event.pressure > 0 ? event.pressure : 0.5;
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      pressure
    };
  }

  function renderQueuedPoints() {
    frameRequest = 0;
    if (!previousPoint || !queuedPoints.length) return;

    const points = queuedPoints;
    queuedPoints = [];
    context.beginPath();
    context.moveTo(previousPoint.x, previousPoint.y);

    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      const nextPoint = points[index + 1] || point;
      const midpoint = {
        x: (point.x + nextPoint.x) / 2,
        y: (point.y + nextPoint.y) / 2
      };
      context.lineWidth = baseLineWidth * (0.78 + point.pressure * 0.44);
      context.quadraticCurveTo(point.x, point.y, midpoint.x, midpoint.y);
    }

    context.stroke();
    previousPoint = points[points.length - 1];
  }

  function scheduleDraw() {
    if (!frameRequest) frameRequest = window.requestAnimationFrame(renderQueuedPoints);
  }

  function startDrawing(event) {
    // Touch remains native vertical scrolling; mouse and pen become the pencil.
    if (event.pointerType === 'touch' || (event.pointerType === 'mouse' && event.button !== 0)) return;
    drawing = true;
    activePointer = event.pointerId;
    queuedPoints = [];
    previousPoint = getPoint(event);
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function draw(event) {
    if (!drawing || event.pointerId !== activePointer) return;
    const samples = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
    queuedPoints.push(...samples.map(getPoint));
    scheduleDraw();
    event.preventDefault();
  }

  function stopDrawing(event) {
    if (!drawing || event.pointerId !== activePointer) return;
    if (queuedPoints.length) renderQueuedPoints();
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    drawing = false;
    activePointer = null;
    previousPoint = null;
    event.preventDefault();
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(resizeCanvas).observe(banner);
  }

  canvas.addEventListener('pointerdown', startDrawing, { passive: false });
  canvas.addEventListener('pointermove', draw, { passive: false });
  canvas.addEventListener('pointerup', stopDrawing, { passive: false });
  canvas.addEventListener('pointercancel', stopDrawing, { passive: false });

  function clamp(value, minimum = 0, maximum = 1) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function smoothStep(value) {
    const progress = clamp(value);
    return progress * progress * (3 - 2 * progress);
  }

  function updateHero() {
    const storyTop = story.getBoundingClientRect().top + window.scrollY;
    const scrollRange = Math.max(story.offsetHeight - window.innerHeight, 1);
    const progress = prefersReducedMotion.matches
      ? 0
      : clamp((window.scrollY - storyTop) / scrollRange);

    story.style.setProperty('--hero-progress', progress.toFixed(4));

    scenes.forEach((scene) => {
      const enter = smoothStep((progress - scene.start) / 0.13);
      const leave = smoothStep((scene.end - progress) / 0.14);
      const visibility = Math.min(enter, leave);
      const x = scene.fromX * (1 - enter) + scene.toX * (1 - leave);
      const y = scene.fromY * (1 - enter) + scene.toY * (1 - leave);
      const rotation = scene.rotate * (1 - visibility * 0.72);

      scene.element.style.setProperty('--hero-opacity', visibility.toFixed(3));
      scene.element.style.setProperty('--hero-shift-x', `${x.toFixed(1)}px`);
      scene.element.style.setProperty('--hero-shift-y', `${y.toFixed(1)}px`);
      scene.element.style.setProperty('--hero-rotate', `${rotation.toFixed(2)}deg`);
      scene.element.style.setProperty('--hero-scale', (0.94 + visibility * 0.06).toFixed(3));
    });

    const introExit = smoothStep(progress / 0.27);
    if (bannerText) {
      bannerText.style.opacity = String(1 - introExit);
      bannerText.style.transform = `translate(-50%, calc(-50% - ${introExit * 34}px)) scale(${1 - introExit * 0.035})`;
    }
    if (scrollArrow) {
      scrollArrow.style.opacity = String(1 - smoothStep(progress / 0.16));
    }
    drawHint.style.opacity = String(1 - smoothStep(progress / 0.22));
  }

  let heroFrameRequest = 0;
  function scheduleHeroUpdate() {
    if (!heroFrameRequest) {
      heroFrameRequest = window.requestAnimationFrame(() => {
        heroFrameRequest = 0;
        updateHero();
      });
    }
  }

  updateHero();
  window.addEventListener('scroll', scheduleHeroUpdate, { passive: true });
  window.addEventListener('resize', scheduleHeroUpdate, { passive: true });
  prefersReducedMotion.addEventListener?.('change', scheduleHeroUpdate);
})();
