/**
 * 637 Signal Stream
 *
 * Turns the existing Hexo index cards into a horizontal story on desktop.
 * Vertical page progress drives the horizontal transform; touch devices and
 * reduced-motion users keep a native, scroll-snapping horizontal list.
 */
(function () {
  const DESKTOP_QUERY = '(min-width: 960px)';
  const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
  const STICKY_TOP = 58;

  function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
  }

  function initSignalStream() {
    const board = document.querySelector('#board');
    if (!board || board.querySelector('.signal-stream')) return;

    const cards = Array.from(board.querySelectorAll('.index-card'));
    if (cards.length < 2) return;

    const cardContainer = cards[0].parentElement;
    if (!cardContainer || !cards.every((card) => card.parentElement === cardContainer)) return;

    const section = document.createElement('section');
    section.className = 'signal-stream';
    section.setAttribute('aria-labelledby', 'signal-stream-title');

    const sticky = document.createElement('div');
    sticky.className = 'signal-stream__sticky';

    const header = document.createElement('header');
    header.className = 'signal-stream__header';
    header.innerHTML = [
      '<div>',
      '  <p class="signal-stream__eyebrow">637 SIGNAL STREAM</p>',
      '  <h2 id="signal-stream-title">Scroll through the field notes</h2>',
      '</div>',
      '<div class="signal-stream__status" aria-hidden="true">',
      '  <span class="signal-stream__count"><b>01</b> / ' + String(cards.length).padStart(2, '0') + '</span>',
      '  <span class="signal-stream__hint">SCROLL TO EXPLORE →</span>',
      '</div>'
    ].join('');

    const progress = document.createElement('div');
    progress.className = 'signal-stream__progress';
    progress.setAttribute('aria-hidden', 'true');
    progress.innerHTML = '<span></span>';

    const viewport = document.createElement('div');
    viewport.className = 'signal-stream__viewport';
    viewport.tabIndex = 0;
    viewport.setAttribute('role', 'group');
    viewport.setAttribute('aria-label', 'Latest articles. Use the left and right arrow keys to browse.');

    const track = document.createElement('div');
    track.className = 'signal-stream__track';

    cardContainer.insertBefore(section, cards[0]);
    cards.forEach((card, index) => {
      card.classList.add('signal-stream__card');
      card.classList.toggle('signal-stream__card--text-only', !card.querySelector('.index-img'));
      card.style.setProperty('--signal-index', index);
      track.appendChild(card);
    });

    viewport.appendChild(track);
    sticky.appendChild(header);
    sticky.appendChild(progress);
    sticky.appendChild(viewport);
    section.appendChild(sticky);

    const desktopMedia = window.matchMedia(DESKTOP_QUERY);
    const reducedMotionMedia = window.matchMedia(REDUCED_MOTION_QUERY);
    const countCurrent = header.querySelector('.signal-stream__count b');
    const progressValue = progress.querySelector('span');
    let desktopMode = false;
    let maximumShift = 0;
    let animationFrame = 0;

    function setProgress(value) {
      const normalized = clamp(value, 0, 1);
      const currentIndex = Math.min(
        cards.length - 1,
        Math.round(normalized * (cards.length - 1))
      );

      progressValue.style.transform = 'scaleX(' + normalized + ')';
      countCurrent.textContent = String(currentIndex + 1).padStart(2, '0');
    }

    function render() {
      animationFrame = 0;
      if (desktopMode) {
        const scrollRange = Math.max(1, section.offsetHeight - window.innerHeight);
        const sectionTop = section.getBoundingClientRect().top;
        const value = clamp((STICKY_TOP - sectionTop) / scrollRange, 0, 1);
        track.style.transform = 'translate3d(' + (-maximumShift * value) + 'px, 0, 0)';
        setProgress(value);
        return;
      }

      const scrollRange = Math.max(1, viewport.scrollWidth - viewport.clientWidth);
      setProgress(viewport.scrollLeft / scrollRange);
    }

    function requestRender() {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(render);
    }

    function measure() {
      desktopMode = desktopMedia.matches && !reducedMotionMedia.matches;
      section.classList.toggle('signal-stream--driven', desktopMode);
      track.style.transform = '';

      if (desktopMode) {
        maximumShift = Math.max(0, track.scrollWidth - viewport.clientWidth);
        section.style.height = Math.ceil(maximumShift + window.innerHeight) + 'px';
      } else {
        maximumShift = 0;
        section.style.height = '';
      }

      requestRender();
    }

    viewport.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;

      if (desktopMode) {
        window.scrollBy({
          top: direction * Math.max(320, window.innerHeight * 0.72),
          behavior: reducedMotionMedia.matches ? 'auto' : 'smooth'
        });
      } else {
        viewport.scrollBy({
          left: direction * Math.max(280, viewport.clientWidth * 0.82),
          behavior: reducedMotionMedia.matches ? 'auto' : 'smooth'
        });
      }
    });

    window.addEventListener('scroll', requestRender, { passive: true });
    viewport.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    desktopMedia.addEventListener('change', measure);
    reducedMotionMedia.addEventListener('change', measure);

    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(measure).observe(track);
    }

    measure();
    document.documentElement.classList.add('has-signal-stream');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSignalStream, { once: true });
  } else {
    initSignalStream();
  }
})();
