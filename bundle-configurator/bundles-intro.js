// Bundles entrance, ported from Branded-UK-Bundles-Intro.html.
// Plays once per visit to the bundles page. Filter re-renders do not call it.
const MOTION = '(prefers-reduced-motion: reduce)';
const RUN_MS = 2240;
const WATERMARK_URL = new URL('./assets/bundles-intro-mark.webp', import.meta.url).href;

const styles = `
  html.buk-bundles-intro-open { overflow: hidden; }
  body:has(> .buk-entry[data-bar="true"]) #branded-nav { z-index: 12001; }
  .buk-entry, .buk-entry * { box-sizing: border-box; }
  .buk-entry {
    --buk-entry-skip-bottom: 16px;
    position: fixed; inset: 0; z-index: 12000; isolation: isolate; overflow: hidden;
    display: grid; grid-template-rows: minmax(0,1fr);
    padding: max(22px,env(safe-area-inset-top)) clamp(20px,4.6vw,72px)
      max(20px,env(safe-area-inset-bottom));
    color: #fff; background: #0b2d3a;
    background-image: radial-gradient(ellipse at 50% 43%,#255965 0%,#174552 27%,#103743 53%,#0b2d3a 81%);
    font-family: Inter, "DM Sans", system-ui, sans-serif;
    text-align: center;
  }
  .buk-entry[data-bar="true"] {
    --buk-entry-skip-bottom: 112px;
    padding-bottom: calc(90px + env(safe-area-inset-bottom));
  }
  .buk-entry-watermark {
    position: absolute; z-index: 0; left: 50%; top: 31%; transform: translate(-50%,-50%);
    width: min(58%,350px,43svh); height: auto; opacity: .12;
    filter: brightness(0) invert(1); pointer-events: none; user-select: none;
  }
  .buk-entry button.buk-entry-skip {
    position: absolute; z-index: 2;
    right: max(clamp(16px,4.6vw,56px),env(safe-area-inset-right,0px));
    bottom: calc(var(--buk-entry-skip-bottom) + env(safe-area-inset-bottom,0px));
    appearance: none; display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    min-height: 44px; padding: 0 13px 0 15px; border-radius: 100px;
    border: 1px solid #ffffff40; background: #0b2d3a68; color: #fff; cursor: pointer;
    font: 560 13px/1 Inter, "DM Sans", system-ui, sans-serif; letter-spacing: 0; white-space: nowrap;
  }
  .buk-entry button.buk-entry-skip:hover { background: #ffffff19; border-color: #ffffff78; }
  .buk-entry button.buk-entry-skip:focus-visible { outline: 2px solid #ff943b; outline-offset: 3px; }
  .buk-entry-center {
    position: relative; z-index: 1;
    align-self: center; justify-self: center; display: grid; justify-items: center;
    transform: translateY(clamp(3px,2.2svh,22px)); width: 100%; max-width: 580px;
  }
  .buk-entry-art {
    display: block; overflow: visible; width: min(clamp(146px,51vw,264px),43svh);
    height: auto; filter: drop-shadow(0 10px 16px #061c2854);
  }
  .buk-entry-flight { position: fixed; z-index: 12002; pointer-events: none; transform-origin: center; }
  #branded-nav .buk-entry-landing .bundle-apron { visibility: hidden; }
  .buk-entry-rig, .buk-entry-piece { transform-box: fill-box; transform-origin: center; }
  .buk-entry-rig { transform-origin: 50% 72%; }
  .buk-entry-piece { opacity: 0; }
  .buk-entry-floor { width: 63%; max-width: 200px; height: 12px; margin: 2px 0 20px;
    border-radius: 50%; background: radial-gradient(ellipse,#041e2ad9,transparent 72%);
  }
  .buk-entry[data-phase="sealed"] { pointer-events: none; }
  .buk-entry[data-phase="sealed"] .buk-entry-skip { visibility: hidden; }
  @media (max-height: 520px) {
    .buk-entry { padding-top: max(10px,env(safe-area-inset-top)); }
    .buk-entry[data-bar="true"] { padding-bottom: calc(79px + env(safe-area-inset-bottom)); }
    .buk-entry-center { transform: none; }
    .buk-entry-art { width: min(35svh,180px); }
    .buk-entry-floor { display: none; }
  }
`;

// The last three vectors trace the positive Bundles mark in the site navbar.
// The mouth clip follows the top edges of the two front flaps.
const art = `
<svg class="buk-entry-art" viewBox="-5 -5 166 154" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="buk-entry-box-inside" x1="0" y1="0" x2="0" y2="1">
      <stop stop-color="#633319"/><stop offset="1" stop-color="#251d23"/>
    </linearGradient>
    <clipPath id="buk-entry-mouth">
      <path d="M-200-360H356V45H141L78 68 15 45H-200Z"/>
    </clipPath>
  </defs>
  <g class="buk-entry-rig">
    <g data-entry-box-back stroke-linejoin="round" stroke-width="2.2">
      <path d="M15 45 77.9 24 141 45 78 68Z" fill="url(#buk-entry-box-inside)" stroke="#185164"/>
      <path d="m15 45 63-21 63 21-13-12-50-17-50 17Z" fill="#db6310" stroke="#1b4d5a"/>
      <path d="m20 44 58-19 58 19" fill="none" stroke="#ff9d51" stroke-opacity=".64" stroke-width="1.25"/>
    </g>
    <g clip-path="url(#buk-entry-mouth)" stroke-linecap="round" stroke-linejoin="round">
      <g class="buk-entry-piece" data-entry-piece="trousers">
        <g transform="translate(51 5)" stroke="#132c3b" stroke-width="2.8">
          <path fill="#657d8c" d="M7 1h38l5 24 3 60-17 1-10-51L16 86 0 85l3-60Z"/>
          <path fill="none" stroke="#b8d2d7" stroke-width="1.5" d="M9 8h33M8 15l9-2-7 13M44 15l-9-2 7 13M26 8v24M3 47h13v13H3m34-13h13v13H37"/>
        </g>
      </g>
      <g class="buk-entry-piece" data-entry-piece="jacket">
        <g transform="translate(43 5)" stroke="#123f4c" stroke-width="2.5">
          <path fill="#438c99" d="m19 15 8-4 3-9h15l4 9 8 4 11 8 9 39-12 4-9-25v39H20V41l-9 25L0 62l8-39Z"/>
          <path fill="none" stroke="#d0e7e8" stroke-width="1.5" d="m27 12 11 8 11-8M38 20v56M25 37h9m10 0h9M24 56l9-5m19 5-9-5M21 73h34"/>
        </g>
      </g>
      <g class="buk-entry-piece" data-entry-piece="hoodie">
        <g transform="translate(43 2)" stroke="#21565f" stroke-width="2.5">
          <path fill="#a4c9c1" d="M23 22C25 9 28 1 38 1s14 8 16 21l13 8 10 34-12 4-10-25v36H22V43L12 68 0 64l10-34Z"/>
          <path fill="none" stroke="#497c80" stroke-width="1.6" d="M24 22c4 8 10 12 14 12s10-4 15-12M32 30v13m12-13v13M28 62l6-7h9l6 7v6H28zM23 72h31"/>
        </g>
      </g>
      <g class="buk-entry-piece" data-entry-piece="sweatshirt">
        <g transform="translate(43 9)" stroke="#735342" stroke-width="2.5">
          <path fill="#eac4a2" d="m26 3-14 6-7 10L0 53l12 4 9-24v37h34V33l9 24 12-4-5-34-7-10-14-6c-3 8-21 8-24 0Z"/>
          <path fill="none" stroke="#a17b60" stroke-width="1.6" d="M25 5c4 12 22 12 26 0M21 63h34M3 49l10 3m50 0 10-3"/>
        </g>
      </g>
      <g class="buk-entry-piece" data-entry-piece="tee">
        <path fill="#fff" stroke="#165469" stroke-width="2.1" d="M27.2 11.6c-7.9 1.5-12.1 7.2-17.1 14.4l-.5 1.3 8.2 4.9 3.6-5.2.2 31.3h27l.4-31.4 3.4 4.8 6.3-5.5c-4.5-8.1-8.2-13.2-14.9-14.7-4 5-12.4 5.1-16.6.1Z"/>
        <path fill="none" stroke="#165469" stroke-width="1.55" d="M28 12c3.3 8 12.1 8.7 15.4.2"/>
      </g>
      <g class="buk-entry-piece" data-entry-piece="hi-vis">
        <path data-entry-vest fill="#15556a" stroke="#165469" stroke-width="2.2" d="M60 4.1 69.7 1C76.3 10 81 9.7 87.6 1L98.5 4c-2.3 10.1-8.1 17.7 1.4 24.6v45.2H59.3V30.3c7.6-5.6 3.2-16.8.7-26.2Z"/>
        <path fill="none" stroke="#f2f8f8" stroke-width="1.6" d="m60.8 5.2 8.2-2.4L79 23 88.2 3.2l8 2.2c-1.7 9-5.7 18.5 2.4 23.8m-37 1.2c7-5.9 4.1-15.8 1.2-23.8M79 23v12.2"/>
        <path fill="#f9ffff" d="M60.5 35.7h37.6v6.2H60.5z"/>
      </g>
      <g class="buk-entry-piece" data-entry-piece="apron">
        <path fill="none" stroke="#78a6b2" stroke-width="2.1" d="M115.5 13.6V8.3a7.4 7.4 0 0 1 14.8 0v5.3"/>
        <path fill="#15556a" stroke="#78a6b2" stroke-width="1.25" d="M113.8 13.2h18.9v9.5c0 5.6 2.9 8.7 7.3 12v32.1h-35.2V34.7c6.4-4.5 9-7.3 9-13.3Z"/>
        <path fill="none" stroke="#ecf6f6" stroke-width="1.7" d="M116 17h14.4m-14.7 18.5h15.4v5.6a2 2 0 0 1-2 2h-11.4a2 2 0 0 1-2-2Z"/>
      </g>
    </g>
    <g data-entry-box-front stroke="#165469" stroke-width="2.25" stroke-linejoin="round">
      <path d="M15.4 57.4 78 78.2l62.6-20.8V108c0 1.5-.6 2.2-1.6 2.8l-61 31.8-61-31.8c-1.1-.6-1.6-1.4-1.6-2.8Z" fill="#ff7a00"/>
      <path d="M78 83v59.6" fill="none"/>
      <path d="M1 61 14.3 46q.6-.9 1.9-.4L78 68l61.8-22.4q1.3-.5 2 .4L155 61 78 92.4Z" fill="#ff7a00"/>
      <path d="M78 68v24.4" fill="none"/>
    </g>
  </g>
</svg>
`;

const sequence = [
  ['trousers',   395, -31, -22, true],
  ['jacket',     565,  33,  19, true],
  ['hoodie',     735, -30, -16, true],
  ['sweatshirt', 905,  34,  15, true],
  ['tee',       1085, -24, -14, false],
  ['hi-vis',    1270,  18,  13, false],
  ['apron',     1460,  27,  18, false],
];

const fillTransform = (x, y, r, scale) => 'translate(' + x + 'px,' + y + 'px) rotate(' + r + 'deg) scale(' + scale + ')';

function landBundlesLogo(scene, button) {
  const logo = scene.querySelector('.buk-entry-art');
  const indicator = button?.closest('#branded-nav')?.querySelector('.indicator');
  const icon = button?.querySelector('.bundle-apron-pos');
  if (!logo || !indicator || !icon || !scene.isConnected) return null;

  const source = logo.getBoundingClientRect();
  const target = button.getBoundingClientRect();
  const disc = indicator.getBoundingClientRect();
  const mark = icon.getBoundingClientRect();
  if (!source.width || !target.width || !disc.height || !mark.width) return null;

  // The disc slides horizontally. Its height and the button's centre give the final position.
  const x = target.left + target.width / 2 - source.left - source.width / 2;
  const y = disc.top + disc.height / 2 - source.top - source.height / 2;
  // The animated SVG has padding around the 156 × 144 navbar artwork.
  const scale = Math.min(mark.width * 166 / 156 / source.width, mark.height * 154 / 144 / source.height);
  const transform = (dx, dy, size) => 'translate3d(' + dx + 'px,' + dy + 'px,0) scale(' + size + ')';

  const spacer = document.createElement('div');
  spacer.style.width = source.width + 'px';
  spacer.style.height = source.height + 'px';
  logo.before(spacer);
  document.body.append(logo);
  logo.classList.add('buk-entry-flight');
  Object.assign(logo.style, {
    left: source.left + 'px',
    top: source.top + 'px',
    width: source.width + 'px',
    height: source.height + 'px',
  });
  button.classList.add('buk-entry-landing');
  scene.querySelector('.buk-entry-center').animate([{ opacity: 1 }, { opacity: 0 }],
    { duration: 175, easing: 'ease-out', fill: 'forwards' });

  const flight = logo.animate([
    { transform: transform(0, 0, 1), easing: 'ease-in-out' },
    { transform: transform(x * .1, y * .03 - 5, .91), offset: .18, easing: 'cubic-bezier(.44,.02,.74,.45)' },
    { transform: transform(x * .68, y * .57, scale + (1 - scale) * .28), offset: .68, easing: 'cubic-bezier(.22,.66,.38,1)' },
    { transform: transform(x, y + 2, scale * .97), offset: .92, easing: 'ease-out' },
    { transform: transform(x, y, scale) },
  ], { duration: 472, fill: 'forwards' });
  let impact;
  let iconBounce;
  function restoreIcon() {
    logo.remove();
    button.classList.remove('buk-entry-landing');
  }
  const finished = flight.finished.then(() => {
    restoreIcon();
    // Vertical rebound only. translate is added on top of the bar's horizontal
    // placement, so the circle does not shift left or right.
    const bounce = [
      { translate: '0px 0px', easing: 'ease-in' },
      { translate: '0px 6px', offset: .34, easing: 'ease-out' },
      { translate: '0px -2px', offset: .68, easing: 'ease-in' },
      { translate: '0px 0px' },
    ];
    const timing = { duration: 320, easing: 'ease-out' };
    impact = indicator.animate(bounce, timing);
    iconBounce = button.querySelector('.icon')?.animate(bounce, timing);
    return Promise.all([
      impact.finished.catch(() => {}),
      iconBounce ? iconBounce.finished.catch(() => {}) : undefined,
    ]);
  }, restoreIcon);
  return {
    finished,
    cancel() {
      flight.cancel();
      impact?.cancel();
      iconBounce?.cancel();
      restoreIcon();
    },
  };
}

export function startBundlesIntro({ trigger = document.activeElement, withNav = false } = {}) {
  const motion = matchMedia(MOTION);
  if (motion.matches || !Element.prototype.animate || document.querySelector('.buk-entry')) return null;
  if (!document.getElementById('buk-entry-styles')) {
    const style = document.createElement('style');
    style.id = 'buk-entry-styles';
    style.textContent = styles;
    document.head.append(style);
  }

  const scene = document.createElement('section');
  scene.className = 'buk-entry';
  scene.dataset.bar = withNav ? 'true' : 'false';
  scene.dataset.phase = 'playing';
  scene.setAttribute('role', 'dialog');
  scene.setAttribute('aria-modal', 'true');
  scene.setAttribute('aria-label', 'Bundles intro');
  scene.innerHTML = '<img class="buk-entry-watermark" src="' + WATERMARK_URL + '" alt="" aria-hidden="true">' +
    '<div class="buk-entry-center">' + art + '<div class="buk-entry-floor" aria-hidden="true"></div></div>' +
    '<button class="buk-entry-skip" type="button" aria-label="Skip intro and open bundles">Skip intro' +
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
  const paused = Array.from(document.body.children).filter(node =>
    node instanceof HTMLElement && !node.inert && !/^(SCRIPT|LINK|STYLE|TEMPLATE)$/.test(node.tagName));
  const root = document.documentElement;
  document.body.append(scene);
  paused.forEach(node => { node.inert = true; });
  root.classList.add('buk-bundles-intro-open');

  const skip = scene.querySelector('.buk-entry-skip');
  let resolve;
  const finished = new Promise(done => { resolve = done; });
  let closed = false;
  let completed = false;
  let landing;
  let timer;
  const animations = [];
  const play = (el, steps, opts) => {
    const animation = el.animate(steps, { fill: 'both', ...opts });
    animations.push(animation);
    return animation;
  };
  function finish(didComplete = false) {
    if (closed) return;
    closed = true;
    completed = didComplete;
    clearTimeout(timer);
    window.removeEventListener('keydown', handleKey);
    motion.removeEventListener?.('change', motionChanged);
    animations.forEach(animation => animation.finish());
    paused.forEach(node => { node.inert = false; });
    root.classList.remove('buk-bundles-intro-open');
    if (trigger instanceof HTMLElement && document.body.contains(trigger)) {
      trigger.focus({ preventScroll: true });
    } else {
      skip.blur();
    }
    scene.dataset.phase = 'sealed';
    scene.inert = true;
    scene.setAttribute('aria-hidden', 'true');
    scene.removeAttribute('aria-modal');
    resolve();
  }
  function release() {
    finish();
    landing?.cancel();
    animations.forEach(animation => animation.cancel());
    scene.remove();
    window.removeEventListener('pageshow', cleanRestoredPage);
  }
  function cleanRestoredPage(event) {
    if (event.persisted) release();
  }
  function handleKey(event) {
    if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault();
      if (event.key === 'Escape') finish();
      else skip.focus({ preventScroll: true });
    }
  }
  function motionChanged(event) {
    if (event.matches) finish();
  }
  skip.addEventListener('click', () => finish(), { once: true });
  window.addEventListener('keydown', handleKey);
  window.addEventListener('pageshow', cleanRestoredPage);
  motion.addEventListener?.('change', motionChanged);
  skip.focus({ preventScroll: true });

  play(scene, [{ opacity: 0 }, { opacity: 1 }], { duration: 145, easing: 'ease-out' });
  play(scene.querySelector('.buk-entry-rig'), [
    { transform: 'translateY(9px) scale(.29)', opacity: .68, easing: 'cubic-bezier(.18,.67,.3,1)' },
    { transform: 'translateY(-2px) scale(1.035)', opacity: 1, offset: .81, easing: 'ease-out' },
    { transform: 'translateY(0) scale(1)', opacity: 1 },
  ], { duration: 375 });
  play(scene.querySelector('.buk-entry-floor'), [{ opacity: 0, transform: 'scaleX(.3)' }, { opacity: 1, transform: 'scaleX(1)' }],
    { duration: 375, easing: 'ease-out' });
  play(scene.querySelector('[data-entry-box-back]'), [{ opacity: 1 }, { opacity: 0 }],
    { delay: 1620, duration: 340, easing: 'ease-in-out' });
  for (const [name, delay, x, angle, hidden] of sequence) {
    const piece = scene.querySelector('[data-entry-piece="' + name + '"]');
    const landing = hidden ? 87 : 0;
    const steps = [
      { opacity: 0, transform: fillTransform(x, -162, angle, .9), easing: 'ease-out' },
      { opacity: 1, transform: fillTransform(x * .82, -145, angle * .87, .94), offset: .15, easing: 'cubic-bezier(.48,.02,.82,.66)' },
      { opacity: 1, transform: fillTransform(0, landing, 0, 1), offset: .82, easing: 'ease-out' },
      { opacity: hidden ? 0 : 1, transform: fillTransform(0, hidden ? landing : -2.6, 0, 1), offset: .91, easing: 'ease-in' },
      { opacity: hidden ? 0 : 1, transform: fillTransform(0, landing, 0, 1) },
    ];
    play(piece, steps, { delay, duration: hidden ? 528 : 535 });
    if (name === 'hi-vis') {
      play(scene.querySelector('[data-entry-vest]'), [
        { fill: '#d9eb57' }, { fill: '#d9eb57', offset: .61 }, { fill: '#15556a' },
      ], { delay, duration: 535 });
    }
  }
  timer = setTimeout(() => finish(true), RUN_MS);
  return {
    scene,
    finished,
    release,
    landOn(button) {
      if (!completed || motion.matches) return null;
      landing ??= landBundlesLogo(scene, button);
      return landing?.finished || null;
    },
  };
}

export function revealBundlesCatalogue(intro, catalogue = document.querySelector('.shell')) {
  if (!intro?.scene.isConnected) return;
  if (matchMedia(MOTION).matches) {
    intro.release();
    return;
  }
  const timing = { duration: 455, easing: 'cubic-bezier(.22,.75,.2,1)' };
  if (catalogue) catalogue.animate([
    { opacity: .55, transform: 'translateY(13px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], timing);
  const cover = intro.scene.animate([
    { opacity: 1, transform: 'translateY(0)' },
    { opacity: 0, transform: 'translateY(-16px)' },
  ], { ...timing, fill: 'forwards' });
  cover.finished.then(intro.release, intro.release);
}

let entryPlayed = false;

// Garments drop, then the logo lands on the Bundles tab and the page scales in.
// Bundles and Filters are already the active white tabs. The bar never moves to Home.
// Once per page load.
export function playBundlesPageIntro() {
  if (entryPlayed) return;
  entryPlayed = true;
  const root = document.documentElement;
  const motion = matchMedia(MOTION);
  const mobile = matchMedia('(max-width: 699px)');
  const releaseHold = () => root.classList.remove('buk-bundles-entry');
  if (!mobile.matches || motion.matches || !Element.prototype.animate) {
    releaseHold();
    return;
  }
  const nav = document.getElementById('branded-nav');
  const page = document.querySelector('.buk-entry-page');
  const select = (pageName, instant) => {
    const bar = window.brandedNav;
    if (bar && typeof bar.selectPage === 'function') {
      bar.selectPage(pageName, { instant: !!instant, emit: false });
    }
  };
  window.addEventListener('pageshow', event => {
    if (event.persisted) releaseHold();
  });
  const failSafe = window.setTimeout(() => {
    releaseHold();
    document.querySelectorAll('body > .buk-entry').forEach(node => node.remove());
    document.querySelectorAll('[inert]').forEach(node => { node.inert = false; });
    select('bundles', true);
  }, 7000);
  requestAnimationFrame(() => { void run(); });

  async function run() {
    let entry = null;
    let onBundles = false;
    try {
      window.scrollTo(0, 0);
      select('bundles', true);
      onBundles = true;
      try {
        entry = startBundlesIntro({ withNav: !!(nav && nav.getBoundingClientRect().width) });
      } catch (error) {
        entry = null;
      }
      if (!entry) return;
      await entry.finished;
      const flight = entry.landOn(nav ? nav.querySelector('[data-page="bundles"]') : null);
      await Promise.all([
        flight && flight.catch ? flight.catch(() => {}) : undefined,
        new Promise(done => setTimeout(done, 540)),
      ]);
      releaseHold();
      const timing = { duration: 900, easing: 'ease-in-out', fill: 'both' };
      const incoming = page ? page.animate([
        { opacity: 0, transform: 'scale(.92)' },
        { opacity: 1, transform: 'scale(1)' },
      ], timing) : null;
      const outgoing = entry.scene.animate([
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(1.08)' },
      ], timing);
      await Promise.allSettled([incoming && incoming.finished, outgoing.finished]);
      if (incoming) incoming.cancel();
      entry.release();
      entry = null;
    } finally {
      window.clearTimeout(failSafe);
      releaseHold();
      if (entry) entry.release();
      if (!onBundles) select('bundles', true);
    }
  }
}
