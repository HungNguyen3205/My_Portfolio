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
  const hover = matchMedia('(any-hover: hover)');
  const sheet = new Image();
  const { width, height } = canvas;

  // The source performs several gestures. Scrub only the outward turn
  // on each side, reversing it as the pointer approaches the center.
  const idle = 0;
  const left = [idle, 1, 2, ...Array.from({ length: 11 }, (_, index) => 10 + index)];
  const right = [idle, ...Array.from({ length: 16 }, (_, index) => 53 + index)];

  let ready = false;
  let paused = false;
  let visible = true;
  let target = 0;
  let position = 0;
  let request = 0;
  let previousTime = 0;
  let lastFrame = -1;
  let touchId = null;

  const canMove = () => ready && !paused && !reduced.matches && visible && !document.hidden;

  function draw() {
    const sequence = position < 0 ? left : right;
    const index = Math.round(Math.abs(position) * (sequence.length - 1));
    const frame = sequence[index];
    if (frame === lastFrame) return;
    context.drawImage(sheet, frame * width, 0, width, height, 0, 0, width, height);
    lastFrame = frame;
  }

  function tick(time) {
    request = 0;
    if (!canMove()) return;

    const elapsed = previousTime ? Math.min(time - previousTime, 50) : 1000 / 60;
    previousTime = time;
    const easing = 1 - Math.exp(-elapsed / 135);
    const step = elapsed / 225;
    const delta = (target - position) * easing;
    position += Math.max(-step, Math.min(step, delta));

    if (Math.abs(target - position) < 0.001) {
      position = target;
      previousTime = 0;
      draw();
      return;
    }

    draw();
    request = requestAnimationFrame(tick);
  }

  function moveTo(value) {
    target = value;
    if (canMove() && !request) request = requestAnimationFrame(tick);
  }

  function follow(event) {
    if (!canMove()) return;
    const bounds = (event.pointerType === 'touch' ? canvas : hero).getBoundingClientRect();
    const offset = (event.clientX - bounds.left) / bounds.width;
    moveTo(Math.max(-1, Math.min(1, (offset - 0.5) / 0.44)));
  }

  function refresh() {
    cancelAnimationFrame(request);
    request = previousTime = 0;
    position = target = 0;
    touchId = null;
    if (ready) draw();

    const stopped = paused || reduced.matches;
    button.disabled = reduced.matches;
    button.setAttribute('aria-pressed', String(stopped));
    button.setAttribute('aria-label', stopped ? 'Bật chuyển động nhân vật' : 'Tạm dừng chuyển động nhân vật');
    button.textContent = stopped ? '▶' : 'Ⅱ';
    caption.textContent = reduced.matches ? 'Chuyển động đã giảm theo cài đặt thiết bị'
      : paused ? 'Chuyển động đã tạm dừng'
      : hover.matches ? 'Di chuyển chuột — Hùng sẽ nhìn theo bạn'
      : 'Chạm hoặc kéo ngang để Hùng nhìn theo';
  }

  hero.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch' || event.pointerId === touchId) follow(event);
  }, { passive: true });
  hero.addEventListener('pointerleave', () => moveTo(0));
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || !canMove()) return;
    touchId = event.pointerId;
    follow(event);
  }, { passive: true });
  function endTouch(event) {
    if (event.pointerId !== touchId) return;
    touchId = null;
    moveTo(0);
  }
  window.addEventListener('pointerup', endTouch);
  window.addEventListener('pointercancel', endTouch);
  window.addEventListener('blur', () => moveTo(0));
  button.addEventListener('click', () => {
    paused = !paused;
    refresh();
  });
  document.addEventListener('visibilitychange', refresh);
  reduced.addEventListener('change', refresh);
  hover.addEventListener('change', refresh);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) refresh();
    }).observe(stage);
  }

  sheet.src = 'assets/hung-motion-bright.jpg';
  sheet.decode().then(() => {
    if (sheet.naturalWidth !== width * 119 || sheet.naturalHeight !== height) {
      throw new Error('Unexpected sprite dimensions');
    }
    ready = true;
    refresh();
    stage.classList.add('avatar-ready');
  }).catch(() => {
    caption.textContent = 'Nguyễn Nam Hùng · Fullstack Developer';
  });
})();
