/**
 * Hero sketch overlay: canvas that lets visitors draw trails over the homepage banner.
 * Designed to work with image or video backgrounds without shifting existing layout.
 */
(function () {
  const banner = document.querySelector('#banner');
  if (!banner || document.querySelector('#hero-sketch-canvas')) return;

  // Fluid renders banner_img as a CSS background. Replace video URLs with an
  // actual video element so MP4/WebM banners work instead of becoming a broken
  // background image.
  const backgroundImage = banner.style.backgroundImage || window.getComputedStyle(banner).backgroundImage;
  const videoUrl = backgroundImage.match(/^url\(["']?(.+?\.(?:mp4|webm|ogg)(?:\?[^"']*)?)["']?\)$/i)?.[1];
  if (videoUrl) {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('aria-hidden', 'true');
    video.style.position = 'absolute';
    video.style.inset = '0';
    video.style.zIndex = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.pointerEvents = 'none';
    // Fluid's startup code always parses banner.backgroundImage as url(...).
    // Keep a transparent data URL in place so its image-loading progress hook
    // remains valid after the real visual has moved into the video element.
    banner.style.backgroundImage = 'url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==")';
    banner.prepend(video);
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'hero-sketch-canvas';
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.zIndex = '2';
  canvas.style.pointerEvents = 'auto';
  canvas.style.touchAction = 'none';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.cursor = 'crosshair';
  canvas.style.background = 'transparent';

  banner.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const strokeColor = 'rgba(255, 255, 255, 0.85)';
  const lineWidth = 3;
  let drawing = false;
  let activePointer = null;

  function applyStrokeStyles() {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
  }

  function resizeCanvas() {
    const width = banner.clientWidth;
    const height = banner.clientHeight;
    if (!width || !height) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    applyStrokeStyles();
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(resizeCanvas).observe(banner);
  }

  function getPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function startDrawing(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    drawing = true;
    activePointer = event.pointerId;
    ctx.beginPath();
    const { x, y } = getPoint(event);
    ctx.moveTo(x, y);
    event.preventDefault();
  }

  function draw(event) {
    if (!drawing || event.pointerId !== activePointer) return;
    const { x, y } = getPoint(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    event.preventDefault();
  }

  function stopDrawing(event) {
    if (!drawing || event.pointerId !== activePointer) return;
    ctx.stroke();
    ctx.closePath();
    drawing = false;
    activePointer = null;
    event.preventDefault();
  }

  const listenerOptions = { passive: false };
  canvas.addEventListener('pointerdown', startDrawing, listenerOptions);
  canvas.addEventListener('pointermove', draw, listenerOptions);
  canvas.addEventListener('pointerup', stopDrawing, listenerOptions);
  canvas.addEventListener('pointercancel', stopDrawing, listenerOptions);
  canvas.addEventListener('pointerleave', stopDrawing, listenerOptions);

  // Keep text and scroll control visible above the canvas.
  const bannerText = banner.querySelector('.banner-text');
  if (bannerText) {
    bannerText.style.position = 'relative';
    bannerText.style.zIndex = '3';
    bannerText.style.pointerEvents = 'none';
  }
  const scrollArrow = banner.querySelector('.scroll-down-bar');
  if (scrollArrow) {
    scrollArrow.style.position = 'relative';
    scrollArrow.style.zIndex = '3';
  }
})();
