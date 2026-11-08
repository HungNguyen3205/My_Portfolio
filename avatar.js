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
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Vẽ đúng độ phân giải đang hiển thị (không vẽ 880px rồi để trình duyệt thu nhỏ):
  // mỗi khung nhẹ hơn → giữ được NHIỀU khung đã giải mã sẵn → quay nhanh mà không giật.
  // Khung hình nét cao 1320x1080 (trích lại từ video gốc 1080p) → không bị nhoè trên màn hình nét cao.
  const SRC_W = 1320, SRC_H = 1080;
  const shownW = (stage.querySelector('.avatar-fallback') || canvas).getBoundingClientRect().width || 680;
  const scale = Math.min(1, shownW * Math.min(devicePixelRatio || 1, 2) / SRC_W);
  canvas.width = Math.round(SRC_W * scale);
  canvas.height = Math.round(SRC_H * scale);
  const { width, height } = canvas;

  const FRAMES = 239;
  const src = i => `assets/hero-frames/${String(i).padStart(3, '0')}.webp?v=hd1`;

  /* ---------- "Đường quay sạch": bỏ các khung nhắm mắt ----------
     Bộ khung gốc là một vòng xoay đầu có 6 lần chớp mắt. Trước đây mỗi lần quay đầu đi ngang qua
     đó là mắt nhắm lại chớp nháy → nhìn như giật. Giờ chuyển động chạy trên dãy khung MỞ MẮT;
     đoạn nhắm mắt được thay bằng hòa trộn mềm giữa hai khung mở mắt hai bên. */
  const BLINKS = [[9, 13], [27, 31], [89, 92], [130, 134], [153, 159], [187, 198]];
  const TRACK = [];
  for (let f = 0; f < FRAMES; f++) if (!BLINKS.some(([a, b]) => f >= a && f <= b)) TRACK.push(f);
  const N = TRACK.length;                         // số khung trên đường quay sạch
  const vOf = new Array(FRAMES).fill(-1);         // khung gốc → vị trí trên đường quay
  TRACK.forEach((f, v) => { vOf[f] = v; });
  // Cặp khung kề nhau nằm hai bên một đoạn nhắm mắt (đầu lệch nhau nhiều) → chuyển nhanh, không hòa trộn lâu.
  const gapAfter = TRACK.map((f, v) => ((TRACK[(v + 1) % N] - f + FRAMES) % FRAMES) > 1);

  const wrap = v => ((v % N) + N) % N;
  const shortest = (from, to) => wrap(to - from + N / 2) - N / 2;
  const rawAt = v => TRACK[wrap(Math.round(v))];
  const toV = raw => {                            // khung gốc bất kỳ → vị trí gần nhất trên đường quay
    for (let d = 0; d < FRAMES; d++) {
      const a = vOf[((raw - d) % FRAMES + FRAMES) % FRAMES]; if (a >= 0) return a;
      const b = vOf[(raw + d) % FRAMES]; if (b >= 0) return b;
    }
    return 0;
  };

  // 8 hướng nhìn theo chiều kim đồng hồ, bắt đầu từ 0° (chuột bên phải nhân vật).
  // "Nhìn xuống" đổi từ khung 193 (đang nhắm mắt) sang 201 (mở mắt nhìn xuống).
  const poses = [145, 176, 201, 19, 43, 60, 79, 105].map(toV);
  const workPose = toV(200);     // cúi nhìn laptop
  const frontPose = toV(0);
  const inactivityDelay = 3500;  // giữ ánh nhìn khi chuột dừng

  function poseForAngle(angle) {
    const norm = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const sector = norm / (Math.PI / 4);
    const i = Math.floor(sector), frac = sector - i;
    const p0 = poses[i % 8], p1 = poses[(i + 1) % 8];
    return wrap(p0 + wrap(p1 - p0) * frac);
  }

  /* ---------- Nạp & giải mã khung hình (hàng đợi ưu tiên) ----------
     Trước đây mỗi lần chuột nhích là ra lệnh giải mã tới 120 khung CÙNG LÚC (mỗi khung 2 lần giải mã)
     → máy nghẽn, nhân vật khựng. Giờ:
       - giữ dữ liệu NÉN của mọi khung trong bộ nhớ (nhẹ, ~30MB) → giải mã lại không cần tải lại;
       - giải mã thẳng từ dữ liệu ảnh ở luồng nền (createImageBitmap(blob)), không qua thẻ <img>;
       - tối đa 2 khung giải mã cùng lúc, luôn ưu tiên khung GẦN NHẤT phía trước hướng đang quay. */
  const blobs = new Array(FRAMES);    // dữ liệu nén (Promise<Blob|HTMLImageElement>)
  const bitmaps = new Array(FRAMES);  // ảnh đã giải mã (nặng), giữ giới hạn theo bộ nhớ
  const decoding = new Array(FRAMES);
  const waiters = new Array(FRAMES);
  const memGB = navigator.deviceMemory || 4;
  const budget = (memGB >= 8 ? 560 : memGB >= 4 ? 300 : 150) * 1048576;
  const MAX_DECODED = Math.max(48, Math.min(N, Math.floor(budget / (width * height * 4))));
  const MAX_ACTIVE = 2;
  let decodedCount = 0, active = 0;
  let wantFrom = 0, wantTo = 0;       // đoạn đường quay đang cần (vị trí không cuộn vòng)

  // Tải dữ liệu nén: fetch → Blob (giải mã ngoài luồng chính). Mở bằng file:// thì fetch bị chặn → dùng <img>.
  function loadData(i) {
    if (!blobs[i]) blobs[i] = fetch(src(i)).then(r => { if (!r.ok) throw 0; return r.blob(); })
      .catch(() => new Promise((resolve, reject) => {
        const img = new Image(); img.decoding = 'async';
        img.onload = () => resolve(img); img.onerror = () => { blobs[i] = null; reject(new Error('frame ' + i)); };
        img.src = src(i);
      }));
    return blobs[i];
  }

  async function toBitmap(data) {
    const opts = scale < 1 ? { resizeWidth: width, resizeHeight: height, resizeQuality: 'high' } : undefined;
    if ('createImageBitmap' in window) {
      try { return await createImageBitmap(data, opts); } catch (e) {}
      try { return await createImageBitmap(data); } catch (e) {}
    }
    if (data instanceof Blob) {             // trình duyệt rất cũ: giải mã qua <img>
      const img = new Image(); img.src = URL.createObjectURL(data);
      try { await img.decode(); } catch (e) {}
      return img;
    }
    return data;
  }

  // Khoảng cách ưu tiên của khung gốc i: gần vị trí hiện tại & nằm trên đường đang quay thì giải mã trước.
  function priority(i) {
    const d = shortest(wrap(pos), vOf[i]);
    const dir = Math.sign(wantTo - wantFrom) || Math.sign(vel) || 1;
    const reach = Math.abs(wantTo - pos);
    // phía trước hướng quay & còn trong đoạn sắp đi qua → ưu tiên gấp đôi
    return Math.sign(d) === dir && Math.abs(d) <= reach + 2 ? Math.abs(d) * 0.5 : Math.abs(d);
  }

  function pump() {
    while (active < MAX_ACTIVE) {
      let best = -1, bestP = Infinity;
      for (let v = 0; v < N; v++) {
        const i = TRACK[v];
        if (bitmaps[i] || decoding[i]) continue;
        const p = waiters[i] ? -1 : priority(i);
        if (p < bestP) { bestP = p; best = i; }
      }
      // Hết khung cần gấp và đã đầy bộ nhớ → thôi, không giải mã thêm.
      if (best < 0 || (bestP > 6 && decodedCount >= MAX_DECODED)) return;
      start(best);
    }
  }

  function start(i) {
    active++;
    decoding[i] = true;
    loadData(i).then(toBitmap).then(bmp => {
      bitmaps[i] = bmp; decodedCount++;
      evict();
      if (Math.abs(shortest(wrap(pos), vOf[i])) < 2) { lastDrawn = NaN; if (ready && !raf) draw(pos); }
    }).catch(() => {}).finally(() => {
      decoding[i] = false; active--;
      if (waiters[i]) { waiters[i].forEach(fn => fn(bitmaps[i])); waiters[i] = null; }
      pump();
    });
  }

  // decode nhận VỊ TRÍ trên đường quay (v): xin giải mã gấp, trả về Promise khi xong.
  function decode(v) {
    const i = rawAt(v);
    if (bitmaps[i]) return Promise.resolve(bitmaps[i]);
    return new Promise(resolve => { (waiters[i] = waiters[i] || []).push(resolve); pump(); });
  }

  function evict() {
    if (decodedCount <= MAX_DECODED) return;
    const scored = [];
    for (let v = 0; v < N; v++) { const i = TRACK[v]; if (bitmaps[i]) scored.push([priority(i), i]); }
    scored.sort((a, b) => b[0] - a[0]);
    for (let k = 0; decodedCount > MAX_DECODED && k < scored.length; k++) {
      if (scored[k][0] < 10) break;          // không xoá khung đang ở gần
      const i = scored[k][1];
      if (bitmaps[i].close) bitmaps[i].close(); bitmaps[i] = null; decodedCount--;
    }
  }

  // Đánh dấu đoạn đường sắp quay qua → hàng đợi tự ưu tiên các khung đó (không giải mã ồ ạt).
  function prefetchPath(fromU, toU) {
    wantFrom = fromU;
    wantTo = fromU + Math.sign(toU - fromU) * Math.min(Math.abs(toU - fromU) + 6, 80);
    pump();
  }

  // Tải nền dữ liệu nén của mọi khung (nhẹ), rồi để hàng đợi tự lấp đầy bộ nhớ quanh vị trí hiện tại.
  function backgroundLoad() {
    const order = Array.from({ length: N }, (_, v) => v)
      .sort((a, b) => Math.abs(shortest(frontPose, a)) - Math.abs(shortest(frontPose, b)));
    let next = 0;
    const worker = () => next < order.length ? loadData(TRACK[order[next++]]).catch(() => {}).then(worker) : pump();
    for (let k = 0; k < 4; k++) worker();
  }

  /* ---------- Vẽ ---------- */
  function nearestDecoded(v, dir) {
    for (let d = 0; d <= 10; d++) {
      const a = bitmaps[rawAt(v - dir * d)]; if (a) return a;   // ưu tiên khung đã đi qua
      const b = bitmaps[rawAt(v + dir * d)]; if (b) return b;
    }
    return null;
  }

  let lastDrawn = NaN;
  function draw(p, dir = 1) {
    if (Math.abs(p - lastDrawn) < 0.004) return;
    const f = wrap(p), v0 = Math.floor(f);
    let t = f - v0;
    // Qua chỗ nối đoạn nhắm mắt: thu hẹp vùng hòa trộn → không thấy bóng mờ hai lớp.
    if (gapAfter[v0]) { const x = Math.min(1, Math.max(0, (t - 0.42) / 0.16)); t = x * x * (3 - 2 * x); }
    const a = bitmaps[TRACK[v0]], b = bitmaps[TRACK[(v0 + 1) % N]];
    if (a && b && t > 0.015 && t < 0.985) {
      ctx.clearRect(0, 0, width, height);
      // Hòa trộn tuyến tính hai khung kề nhau → chuyển động liền mạch như video.
      ctx.globalAlpha = 1 - t;
      ctx.drawImage(a, 0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = t;
      ctx.drawImage(b, 0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    } else {
      const img = (t < 0.5 ? a : b) || a || b || nearestDecoded(Math.round(f), dir);
      // Chưa có khung nào gần → giữ nguyên hình đang hiển thị, tránh canvas trống.
      if (!img) { lastDrawn = NaN; return; }
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
    }
    lastDrawn = p;
  }

  /* ---------- Chuyển động: lò xo giảm chấn tới hạn ---------- */
  let pos = 0;        // vị trí không cuộn vòng (đơn vị: khung trên đường quay sạch)
  let vel = 0;        // khung/giây
  let targetU = 0;    // mục tiêu không cuộn vòng
  let targetFrame = 0;
  let raf = 0, lastT = 0;
  let ready = false, paused = false, touchId = null, idleTimer;

  // Mượt như video: tốc độ tối đa ~150 khung/giây → mỗi lần màn hình vẽ (60Hz) chỉ tiến ~2,5 khung
  // và luôn được hòa trộn, không "nhảy cóc" 8–9 khung như trước (nhìn như tua nhanh, giật).
  const OMEGA = 11;
  const MAX_SPEED = 150;
  const MAX_ACCEL = 1400; // giới hạn gia tốc: bắt đầu/đổi hướng êm, không khựng

  function tick(now) {
    raf = 0;
    let dt = lastT ? (now - lastT) / 1000 : 1 / 60;
    lastT = now;
    dt = Math.min(dt, 1 / 20);
    const n = Math.ceil(dt / (1 / 240));
    const h = dt / n;
    for (let k = 0; k < n; k++) {
      const err = targetU - pos;
      let acc = OMEGA * OMEGA * err - 2 * OMEGA * vel;
      acc = Math.max(-MAX_ACCEL, Math.min(MAX_ACCEL, acc));
      vel = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, vel + acc * h));
      pos += vel * h;
    }
    const done = Math.abs(targetU - pos) < 0.02 && Math.abs(vel) < 0.3;
    if (done) { pos = targetU; vel = 0; }
    draw(pos, Math.sign(vel) || 1);
    if (!done) raf = requestAnimationFrame(tick);
    else { lastT = 0; pos = targetU = wrap(pos); lastDrawn = pos; }
  }

  function moveTo(v) {
    v = wrap(v);
    if (gapAfter[Math.floor(v)]) v = wrap(Math.round(v)); // không dừng lại giữa chỗ nối
    const here = wrap(pos);
    let d = shortest(here, v);

    // Đổi giữa nhìn trái ↔ phải: luôn đi qua phía trước mặt (không lộn qua đỉnh đầu).
    const hr = rawAt(here), tr = rawAt(v);
    const left = f => f >= 35 && f <= 55, right = f => f >= 135 && f <= 160;
    if (left(hr) && right(tr)) d = -wrap(here - v);
    else if (right(hr) && left(tr)) d = wrap(v - here);
    // Đang quay một chiều mà mục tiêu nằm gần điểm đối xứng: giữ chiều cũ (quán tính).
    else if (Math.abs(vel) > 15 && Math.sign(d) !== Math.sign(vel) && Math.abs(d) > N / 2 - 35) {
      d = d - Math.sign(d) * N;
    }

    const nextU = pos + d;
    if (Math.abs(nextU - targetU) < 0.01 && v === targetFrame) return;
    targetFrame = v;
    targetU = nextU;
    prefetchPath(pos, targetU);
    if (ready && !raf) { lastT = 0; raf = requestAnimationFrame(tick); }
  }

  /* ---------- Tương tác ---------- */
  const introOpen = () => document.body.classList.contains('intro-open');

  function idle() {
    clearTimeout(idleTimer);
    // Đang chiếu video lời chào: giữ tư thế nhìn thẳng — đúng tư thế ở khung cuối video,
    // để khi lớp intro mờ đi, nhân vật trong video "tiếp nối" sang nhân vật tương tác.
    if (introOpen()) { moveTo(frontPose); return; }
    if (paused || reduced.matches) {
      const side = toV(210);
      moveTo(Math.abs(shortest(wrap(pos), frontPose)) < Math.abs(shortest(wrap(pos), side)) ? frontPose : side);
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

  // Nhìn theo chuột ở MỌI vị trí trên màn hình, đủ 360° quanh nhân vật
  // (trước đây chuột cách xa hơn ~560px là nhân vật bỏ qua và quay về nhìn laptop).
  let heroVisible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; if (!heroVisible && ready) idle(); }).observe(stage);
  }

  // Lưu vị trí canvas, chỉ đo lại khi cuộn/đổi kích thước (không bắt trình duyệt tính layout mỗi khung hình).
  let rectCache = null;
  const dropRect = () => { rectCache = null; };
  addEventListener('scroll', dropRect, { passive: true });
  addEventListener('resize', dropRect);

  let greetTimers = [];
  const stopGreeting = () => { greetTimers.forEach(clearTimeout); greetTimers = []; };

  function follow(p) {
    if (!ready || paused || reduced.matches || !p || !heroVisible || introOpen()) return;
    stopGreeting(); // người xem đã rê chuột → nhìn theo chuột ngay
    const r = rectCache || (rectCache = canvas.getBoundingClientRect());
    const dx = p.x - (r.left + r.width * 0.5);
    const dy = p.y - (r.top + r.height * 0.38);
    const dist = Math.hypot(dx, dy);
    clearTimeout(idleTimer);
    idleTimer = setTimeout(idle, inactivityDelay);

    if (dist < r.width * 0.085) { moveTo(frontPose); return; }
    moveTo(poseForAngle(Math.atan2(dy, dx)));
  }

  function refresh() {
    clearTimeout(idleTimer);
    const stopped = paused || reduced.matches;
    button.disabled = reduced.matches;
    button.setAttribute('aria-pressed', String(stopped));
    button.setAttribute('aria-label', stopped ? 'Bật chuyển động nhân vật' : 'Tạm dừng chuyển động nhân vật');
    button.textContent = stopped ? '▶' : 'Ⅱ';
    caption.textContent = stopped ? 'Chuyển động đã tạm dừng'
      : (finePointer ? 'Rê chuột gần Hùng để nhìn theo' : 'Chạm vào Hùng để nhìn theo');
    if (reduced.matches) {
      cancelAnimationFrame(raf); raf = 0; vel = 0;
      pos = targetU = frontPose; lastDrawn = NaN; draw(frontPose);
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

  // Lời chào xong: liếc trái → liếc phải → nhìn thẳng vào người xem, rồi bắt đầu nhìn theo chuột.
  addEventListener('portfolio:intro-done', () => {
    if (!ready || paused || reduced.matches) return;
    stopGreeting();
    clearTimeout(idleTimer);
    stage.classList.remove('is-hint'); void stage.offsetWidth; stage.classList.add('is-hint');
    greetTimers.push(setTimeout(() => stage.classList.remove('is-hint'), 3400));
    const seq = [[toV(43), 650], [toV(145), 1500], [frontPose, 2500]];
    seq.forEach(([v, at]) => greetTimers.push(setTimeout(() => moveTo(v), at)));
    idleTimer = setTimeout(idle, 2500 + inactivityDelay);
  });

  button.addEventListener('click', () => { paused = !paused; refresh(); });
  reduced.addEventListener('change', refresh);

  /* ---------- Chữ PORTFOLIO trôi nhẹ ngược hướng chuột (chiều sâu) ---------- */
  if (hero && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let mx = 0, my = 0, cx = 0, cy = 0, pRaf = 0;
    // Gán biến thẳng lên chữ PORTFOLIO và lớp ánh sáng (thay vì cả khối hero) → trình duyệt
    // không phải tính lại style cho toàn bộ hero mỗi khung hình.
    const wordmark = hero.querySelector('.hero-wordmark');
    const aurora = hero.querySelector('.hero-aurora');
    const loop = () => {
      cx += (mx - cx) * 0.08; cy += (my - cy) * 0.08;
      if (wordmark) {
        wordmark.style.setProperty('--wm-x', (cx * -18).toFixed(2) + 'px');
        wordmark.style.setProperty('--wm-y', (cy * -10).toFixed(2) + 'px');
      }
      if (aurora) aurora.style.setProperty('--au-x', (cx * 30).toFixed(2) + 'px');
      pRaf = Math.abs(mx - cx) + Math.abs(my - cy) > 0.001 ? requestAnimationFrame(loop) : 0;
    };
    let heroRect = null;
    addEventListener('scroll', () => { heroRect = null; }, { passive: true });
    addEventListener('resize', () => { heroRect = null; });
    hero.addEventListener('pointermove', e => {
      if (reduced.matches) return;
      const r = heroRect || (heroRect = hero.getBoundingClientRect());
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
      if (!pRaf) pRaf = requestAnimationFrame(loop);
    }, { passive: true });
  }

  /* ---------- Khởi động ---------- */
  pos = targetU = targetFrame = frontPose;
  Promise.all([decode(frontPose), decode(frontPose + 1), decode(workPose), decode(workPose - 1)]).then(() => {
    if (!bitmaps[TRACK[frontPose]]) return;   // không tải được → giữ ảnh tĩnh dự phòng
    draw(frontPose);
    ready = true;
    stage.classList.add('avatar-ready');
    refresh();
    const start = () => backgroundLoad();
    'requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 300);
  });
})();
