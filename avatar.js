(() => {
  const stage = document.getElementById('avatar-stage');
  if (!stage) return;

  const hero = stage.closest('.hero');
  const canvas = stage.querySelector('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return;

  const button = document.getElementById('avatar-motion');
  const caption = document.getElementById('avatar-caption');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const { width, height } = canvas;
  const frameCount = 239;
  const stripSize = 16;
  const stripCount = Math.ceil(frameCount / stripSize);
  const sheets = new Map();
  // Clockwise poses from the original take, starting at screen right.
  const poses = [145, 176, 193, 19, 43, 60, 79, 105];
  let position = 0;
  let target = 0;
  let previousTime = 0;
  let velocity = 0;
  let inIdleZone = true;
  let request = 0;
  let lastFrame = -1;
  let paused = false;
  let ready = false;
  let touchId = null;

  const wrap = frame => ((frame % frameCount) + frameCount) % frameCount;
  const distance = (from, to) => wrap(to - from + frameCount / 2) - frameCount / 2;
  const stripFor = frame => Math.floor(frame / stripSize);

  function getStrip(index) {
    if (sheets.has(index)) return sheets.get(index);
    const sheet = { bitmap: null };
    const image = new Image();
    image.src = `assets/hero-motion/${String(index).padStart(2, '0')}.webp`;
    sheet.loaded = image.decode().then(() => {
      sheet.bitmap = image;
    }).catch(() => {
      sheet.failed = true;
    });
    sheets.set(index, sheet);
    return sheet;
  }

  function draw(frame) {
    const index = stripFor(frame);
    const sheet = getStrip(index);
    getStrip((index + 1) % stripCount);
    getStrip((index + stripCount - 1) % stripCount);
    // Keep the current strip and both neighbors available for direction reversals.
    for (const key of sheets.keys()) {
      const gap = Math.abs(key - index);
      if (gap > 1 && gap < stripCount - 1) sheets.delete(key);
    }
    if (!sheet.bitmap) return false;
    if (frame !== lastFrame) {
      context.drawImage(sheet.bitmap, (frame % stripSize) * width, 0, width, height, 0, 0, width, height);
      lastFrame = frame;
    }
    return true;
  }

  function tick(time) {
    request = 0;
    const elapsed = previousTime ? Math.min(time - previousTime, 40) : 16.7;
    previousTime = time;
    const delta = distance(position, target);
    // Ease velocity itself so a new pointer target cannot snap the playback speed.
    const desiredVelocity = Math.max(-0.052, Math.min(0.052, delta / 170));
    const nextVelocity = velocity + (desiredVelocity - velocity) * (1 - Math.exp(-elapsed / 75));
    // At most one source frame per paint, even after a slow display refresh.
    const step = Math.max(-0.95, Math.min(0.95, nextVelocity * elapsed));
    const reachesTarget = Math.sign(step) === Math.sign(delta) && Math.abs(step) >= Math.abs(delta);
    const next = wrap(Math.abs(delta) < 0.35 || reachesTarget ? target : position + step);
    const frame = wrap(Math.round(next));
    if (getStrip(stripFor(frame)).failed) {
      previousTime = velocity = 0;
      return;
    }
    if (draw(frame)) {
      position = next;
      velocity = nextVelocity;
    } else {
      velocity = 0;
    }
    if (Math.abs(distance(position, target)) >= 0.01) {
      request = requestAnimationFrame(tick);
    } else {
      previousTime = velocity = 0;
    }
  }

  function moveTo(frame) {
    target = frame;
    if (ready && !request) request = requestAnimationFrame(tick);
  }

  function idle() {
    // The final part of the take returns to the same frontal pose.
    moveTo(Math.abs(distance(position, 0)) < Math.abs(distance(position, 210)) ? 0 : 210);
  }

  function follow(event) {
    if (!ready || paused || reduced.matches) return;
    const bounds = (event.pointerType === 'touch' ? canvas : hero).getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    const y = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    const radius = Math.hypot(x, y);
    inIdleZone = radius < (inIdleZone ? 0.26 : 0.20);
    if (inIdleZone) {
      idle();
      return;
    }
    const angle = (Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI);
    const sector = angle / (Math.PI / 4);
    const index = Math.floor(sector);
    const start = poses[index];
    const end = poses[(index + 1) % poses.length];
    moveTo(wrap(start + distance(start, end) * (sector - index)));
  }

  function refresh() {
    const stopped = paused || reduced.matches;
    button.disabled = reduced.matches;
    button.setAttribute('aria-pressed', String(stopped));
    button.setAttribute('aria-label', stopped ? 'Bật chuyển động nhân vật' : 'Tạm dừng chuyển động nhân vật');
    button.textContent = stopped ? '▶' : 'Ⅱ';
    caption.textContent = stopped ? 'Chuyển động đã tạm dừng' : 'Rê chuột hoặc chạm để Hùng nhìn theo';
    if (reduced.matches) {
      cancelAnimationFrame(request);
      request = previousTime = velocity = 0;
      getStrip(0).loaded.then(() => {
        if (reduced.matches && draw(0)) position = target = 0;
      });
    } else {
      idle();
    }
  }

  hero.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch' || event.pointerId === touchId) follow(event);
  }, { passive: true });
  hero.addEventListener('pointerleave', () => {
    inIdleZone = true;
    if (!reduced.matches) idle();
  });
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return;
    touchId = event.pointerId;
    follow(event);
  }, { passive: true });
  function endTouch(event) {
    if (event.pointerId !== touchId) return;
    touchId = null;
    if (!reduced.matches) idle();
  }
  window.addEventListener('pointerup', endTouch);
  window.addEventListener('pointercancel', endTouch);
  button.addEventListener('click', () => {
    paused = !paused;
    refresh();
  });
  reduced.addEventListener('change', refresh);

  getStrip(0).loaded.then(() => {
    if (!draw(0)) return;
    ready = true;
    stage.classList.add('avatar-ready');
    refresh();
  });
})();
