/* Nhân vật nhìn theo chuột — bản mượt.
   - 239 khung hình nền trong suốt, mỗi khung một file nhỏ (assets/hero-frames/NNN.webp)
     → giải mã ngoài luồng chính bằng createImageBitmap, không còn ảnh 14.080px vượt giới hạn GPU.
   - Chuyển động dùng lò xo giảm chấn tới hạn trên trục "không cuộn vòng": không giật, không quay ngược.
   - Hướng quay được chốt khi mục tiêu đổi, có quán tính → hết hiện tượng giằng co qua lại.
   - Khung chưa giải mã xong thì vẽ khung gần nhất thay vì đứng chờ → không bao giờ khựng. */
(() => {
  const stage = document.getElementById('avatar-stage');
  if (!stage) return;

  const hero = stage.closest('.hero');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const button = document.getElementById('avatar-motion');
  const caption = document.getElementById('avatar-caption');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const { width, height } = canvas;

  const FRAMES = 239;
  const src = i => `assets/hero-frames/${String(i).padStart(3, '0')}.webp`;

  // 8 điểm neo hướng nhìn theo chiều kim đồng hồ, bắt đầu từ 0° (bên phải).
  const poses = [145, 176, 193, 19, 43, 60, 79, 105];
  const workPose = 200;          // cúi nhìn laptop
  const inactivityDelay = 3500;  // giữ ánh nhìn khi chuột dừng

  const wrap = f => ((f % FRAMES) + FRAMES) % FRAMES;
  const shortest = (from, to) => wrap(to - from + FRAMES / 2) - FRAMES / 2;

  function poseForAngle(angle) {
    const norm = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const sector = norm / (Math.PI / 4);
    const i = Math.floor(sector), frac = sector - i;
    const p0 = poses[i % 8], p1 = poses[(i + 1) % 8];
    const delta = i === 2 ? (FRAMES - p0) + p1 : p1 - p0;
    return wrap(p0 + delta * frac);
  }

  /* ---------- Nạp & giải mã khung hình ---------- */
  const blobs = new Array(FRAMES);    // dữ liệu nén (nhẹ), giữ toàn bộ
  const bitmaps = new Array(FRAMES);  // ảnh đã giải mã (nặng), giữ giới hạn
  const decoding = new Array(FRAMES);
  const MAX_DECODED = 110;
  let decodedCount = 0;

  function fetchBlob(i) {
    if (!blobs[i]) blobs[i] = fetch(src(i)).then(r => { if (!r.ok) throw new Error(r.status); return r.blob(); });
    return blobs[i];
  }

  function toBitmap(blob) {
    if ('createImageBitmap' in window) return createImageBitmap(blob);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img); img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  }

  function decode(i) {
    i = wrap(Math.round(i));
    if (bitmaps[i] || decoding[i]) return decoding[i] || Promise.resolve(bitmaps[i]);
    decoding[i] = fetchBlob(i).then(toBitmap).then(bmp => {
      bitmaps[i] = bmp; decoding[i] = null; decodedCount++;
      evict();
      if (Math.abs(shortest(wrap(pos), i)) < 2) { lastDrawn = NaN; if (ready && !raf) draw(pos); } // vẽ lại nếu đang chờ đúng khung này
      return bmp;
    }).catch(() => { decoding[i] = null; });
    return decoding[i];
  }

  function evict() {
    if (decodedCount <= MAX_DECODED) return;
    const here = wrap(pos), goal = wrap(targetU);
    const scored = [];
    for (let i = 0; i < FRAMES; i++) if (bitmaps[i]) {
      scored.push([Math.min(Math.abs(shortest(here, i)), Math.abs(shortest(goal, i))), i]);
    }
    scored.sort((a, b) => b[0] - a[0]);
    for (let k = 0; decodedCount > MAX_DECODED && k < scored.length; k++) {
      const i = scored[k][1];
      if (scored[k][0] < 12) break;
      bitmaps[i].close?.(); bitmaps[i] = null; decodedCount--;
    }
  }

  // Giải mã trước các khung trên đường đi từ vị trí hiện tại tới mục tiêu.
  function prefetchPath(fromU, toU) {
    const dir = Math.sign(toU - fromU) || 1;
    const steps = Math.min(Math.abs(toU - fromU) + 8, 130);
    for (let s = -3; s <= steps; s += 1) decode(fromU + dir * s);
  }

  // Tải nền toàn bộ dữ liệu nén, ưu tiên khung gần tư thế làm việc.
  function backgroundLoad() {
    const order = Array.from({ length: FRAMES }, (_, i) => i)
      .sort((a, b) => Math.abs(shortest(workPose, a)) - Math.abs(shortest(workPose, b)));
    let next = 0;
    const worker = () => next < order.length ? fetchBlob(order[next++]).catch(() => {}).then(worker) : null;
    for (let k = 0; k < 4; k++) worker();
  }

  /* ---------- Vẽ ---------- */
  function nearestDecoded(i, dir) {
    for (let d = 0; d <= 10; d++) {
      const a = bitmaps[wrap(i - dir * d)]; if (a) return a;   // ưu tiên khung đã đi qua
      const b = bitmaps[wrap(i + dir * d)]; if (b) return b;
    }
    return null;
  }

  let lastDrawn = NaN;
  function draw(p, dir = 1) {
    if (Math.abs(p - lastDrawn) < 0.004) return;
    const f = wrap(p), f0 = Math.floor(f), f1 = wrap(f0 + 1), t = f - f0;
    const a = bitmaps[f0], b = bitmaps[f1];
    ctx.clearRect(0, 0, width, height);
    if (a && b && t > 0.015 && t < 0.985) {
      // Hòa trộn tuyến tính chính xác hai khung kề nhau (không bóng mờ viền).
      ctx.globalAlpha = 1 - t;
      ctx.drawImage(a, 0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = t;
      ctx.drawImage(b, 0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    } else {
      const img = (t < 0.5 ? a : b) || a || b || nearestDecoded(Math.round(f), dir);
      if (!img) { lastDrawn = NaN; return; }
      ctx.drawImage(img, 0, 0, width, height);
    }
    lastDrawn = p;
  }

  /* ---------- Chuyển động: lò xo giảm chấn tới hạn ---------- */
  let pos = 0;        // vị trí không cuộn vòng (đơn vị: khung hình)
  let vel = 0;        // khung/giây
  let targetU = 0;    // mục tiêu không cuộn vòng
  let targetFrame = 0;
  let raf = 0, lastT = 0;
  let ready = false, paused = false, touchId = null, idleTimer;

  const OMEGA = 10;        // độ "nhanh nhạy" của lò xo
  const MAX_SPEED = 190;   // khung/giây

  function tick(now) {
    raf = 0;
    let dt = lastT ? (now - lastT) / 1000 : 1 / 60;
    lastT = now;
    dt = Math.min(dt, 1 / 20);
    // Chia nhỏ bước để ổn định cả khi tab bị chậm.
    const n = Math.ceil(dt / (1 / 120));
    const h = dt / n;
    for (let k = 0; k < n; k++) {
      const err = targetU - pos;
      const acc = OMEGA * OMEGA * err - 2 * OMEGA * vel;
      vel = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, vel + acc * h));
      pos += vel * h;
    }
    const done = Math.abs(targetU - pos) < 0.02 && Math.abs(vel) < 0.3;
    if (done) { pos = targetU; vel = 0; }
    draw(pos, Math.sign(vel) || 1);
    if (!done) raf = requestAnimationFrame(tick);
    else { lastT = 0; pos = targetU = wrap(pos); lastDrawn = pos; }
  }

  function moveTo(frame) {
    frame = wrap(frame);
    const here = wrap(pos);
    let d = shortest(here, frame);

    // Đổi giữa nhìn trái ↔ phải: luôn đi qua phía trước mặt.
    const left = f => f >= 35 && f <= 55, right = f => f >= 135 && f <= 160;
    if (left(here) && right(frame)) d = -wrap(here - frame);
    else if (right(here) && left(frame)) d = wrap(frame - here);
    // Đang quay một chiều mà mục tiêu nằm gần điểm đối xứng: giữ chiều cũ (quán tính).
    else if (Math.abs(vel) > 15 && Math.sign(d) !== Math.sign(vel) && Math.abs(d) > FRAMES / 2 - 40) {
      d = d - Math.sign(d) * FRAMES;
    }

    const nextU = pos + d;
    if (Math.abs(nextU - targetU) < 0.01 && frame === targetFrame) return;
    targetFrame = frame;
    targetU = nextU;
    prefetchPath(pos, targetU);
    if (ready && !raf) { lastT = 0; raf = requestAnimationFrame(tick); }
  }

  /* ---------- Tương tác ---------- */
  function idle() {
    clearTimeout(idleTimer);
    if (paused || reduced.matches) {
      moveTo(Math.abs(shortest(wrap(pos), 0)) < Math.abs(shortest(wrap(pos), 210)) ? 0 : 210);
      return;
    }
    moveTo(workPose);
  }

  // Gom sự kiện chuột vào một lần mỗi khung hình.
  let pendingPointer = null, pointerRaf = 0;
  function queueFollow(e) {
    pendingPointer = { x: e.clientX, y: e.clientY };
    if (!pointerRaf) pointerRaf = requestAnimationFrame(() => { pointerRaf = 0; follow(pendingPointer); });
  }

  function follow(p) {
    if (!ready || paused || reduced.matches || !p) return;
    const r = canvas.getBoundingClientRect();
    const dx = p.x - (r.left + r.width * 0.5);
    const dy = p.y - (r.top + r.height * 0.38);
    const dist = Math.hypot(dx, dy);
    const range = Math.min(innerWidth * 0.44, 560);

    if (dist > range) { clearTimeout(idleTimer); idleTimer = setTimeout(idle, 950); return; }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(idle, inactivityDelay);

    if (dist < r.width * 0.085) { moveTo(0); return; }
    moveTo(poseForAngle(Math.atan2(dy, dx)));
  }

  function refresh() {
    clearTimeout(idleTimer);
    const stopped = paused || reduced.matches;
    button.disabled = reduced.matches;
    button.setAttribute('aria-pressed', String(stopped));
    button.setAttribute('aria-label', stopped ? 'Bật chuyển động nhân vật' : 'Tạm dừng chuyển động nhân vật');
    button.textContent = stopped ? '▶' : 'Ⅱ';
    caption.textContent = stopped ? 'Chuyển động đã tạm dừng' : 'Rê chuột gần Hùng để nhìn theo';
    if (reduced.matches) {
      cancelAnimationFrame(raf); raf = 0; vel = 0;
      pos = targetU = 0; lastDrawn = NaN; draw(0);
    } else idle();
  }

  addEventListener('pointermove', e => {
    if (e.pointerType !== 'touch' || e.pointerId === touchId) queueFollow(e);
  }, { passive: true });
  document.addEventListener('mouseleave', () => { if (!reduced.matches) idle(); });
  addEventListener('blur', () => { if (!reduced.matches) idle(); });

  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch') return;
    touchId = e.pointerId; queueFollow(e);
  }, { passive: true });
  const endTouch = e => { if (e.pointerId !== touchId) return; touchId = null; if (!reduced.matches) idle(); };
  addEventListener('pointerup', endTouch);
  addEventListener('pointercancel', endTouch);

  button.addEventListener('click', () => { paused = !paused; refresh(); });
  reduced.addEventListener('change', refresh);

  /* ---------- Chữ PORTFOLIO trôi nhẹ ngược hướng chuột (chiều sâu) ---------- */
  if (hero && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let mx = 0, my = 0, cx = 0, cy = 0, pRaf = 0;
    const loop = () => {
      cx += (mx - cx) * 0.08; cy += (my - cy) * 0.08;
      hero.style.setProperty('--wm-x', (cx * -18).toFixed(2) + 'px');
      hero.style.setProperty('--wm-y', (cy * -10).toFixed(2) + 'px');
      hero.style.setProperty('--au-x', (cx * 30).toFixed(2) + 'px');
      pRaf = Math.abs(mx - cx) + Math.abs(my - cy) > 0.001 ? requestAnimationFrame(loop) : 0;
    };
    hero.addEventListener('pointermove', e => {
      if (reduced.matches) return;
      const r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
      if (!pRaf) pRaf = requestAnimationFrame(loop);
    }, { passive: true });
  }

  /* ---------- Khởi động ---------- */
  Promise.all([decode(0), decode(workPose), decode(1), decode(workPose - 1)]).then(() => {
    if (!bitmaps[0]) return;           // không tải được → giữ ảnh tĩnh dự phòng
    draw(0);
    ready = true;
    stage.classList.add('avatar-ready');
    refresh();
    const start = () => backgroundLoad();
    'requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 300);
  });
})();
