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

  // Sử dụng toàn bộ 239 khung hình (15 strip) từ source video
  const frameCount = 239;
  const stripSize = 16;
  const stripCount = Math.ceil(frameCount / stripSize);
  const sheets = new Map();

  // 8 điểm neo hướng nhìn theo chiều kim đồng hồ bắt đầu từ 0° (bên phải):
  // 0° (phải): 145, 45° (dưới-phải): 176, 90° (dưới): 193,
  // 135° (dưới-trái): 19, 180° (trái): 43, 225° (trên-trái): 60,
  // 270° (trên): 79, 315° (trên-phải): 105.
  const poses = [145, 176, 193, 19, 43, 60, 79, 105];

  // Tính toán khung hình mục tiêu liên tục theo góc chuột (Continuous Analog Rotation)
  // Không bị giật theo 8 góc cứng mà xoay mượt mà 360 độ theo mọi phân độ góc của chuột
  function getContinuousPose(angle) {
    const norm = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const sector = norm / (Math.PI / 4);
    const i = Math.floor(sector);
    const frac = sector - i;
    const p0 = poses[i % 8];
    const p1 = poses[(i + 1) % 8];
    const delta = (i === 2) ? ((frameCount - p0) + p1) : (p1 - p0);
    return ((p0 + delta * frac) % frameCount + frameCount) % frameCount;
  }

  // Tư thế nhìn xuống laptop làm việc
  const workPose = 200;
  // Thời gian giữ ánh nhìn khi chuột dừng di chuyển trong vùng tương tác
  const inactivityDelay = 3500;

  let idleTimer;
  let position = 0;
  let target = 0;
  let previousTime = 0;
  let velocity = 0;
  let request = 0;
  let lastDrawnPos = -1;
  let paused = false;
  let ready = false;
  let touchId = null;

  const wrap = frame => ((frame % frameCount) + frameCount) % frameCount;
  const distance = (from, to) => wrap(to - from + frameCount / 2) - frameCount / 2;

  function turnDistance(from, to) {
    // Khi đổi giữa nhìn ngang trái (35–55) và ngang phải (135–160), đi qua phía trước mặt
    const isHorizLeft = f => f >= 35 && f <= 55;
    const isHorizRight = f => f >= 135 && f <= 160;
    if (isHorizLeft(from) && isHorizRight(to)) return -wrap(from - to);
    if (isHorizRight(from) && isHorizLeft(to)) return wrap(to - from);
    return distance(from, to);
  }

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

  // Nạp trước toàn bộ các dải ảnh vào RAM để đảm bảo 0% drop frame
  function preloadAllStrips() {
    for (let i = 0; i <= stripCount; i++) {
      getStrip(i);
    }
  }

  // Nội suy khung hình phụ (Sub-frame Interpolation)
  // Tự động sinh thêm hàng loạt khung hình trung gian ảo mượt mà giữa các frame gốc
  function drawContinuous(pos) {
    if (pos === lastDrawnPos) return true;
    const f = wrap(pos);
    const f0 = Math.floor(f);
    const f1 = (f0 + 1) % frameCount;
    const frac = f - f0;

    const sheet0 = getStrip(stripFor(f0));
    if (!sheet0.bitmap) return false;

    // Khi dừng hoặc ở cực gần frame gốc: vẽ nét căng 100%
    if (frac < 0.02) {
      context.globalAlpha = 1.0;
      context.drawImage(sheet0.bitmap, (f0 % stripSize) * width, 0, width, height, 0, 0, width, height);
      lastDrawnPos = pos;
      return true;
    }

    if (frac > 0.98) {
      const sheet1 = getStrip(stripFor(f1));
      if (!sheet1.bitmap) return false;
      context.globalAlpha = 1.0;
      context.drawImage(sheet1.bitmap, (f1 % stripSize) * width, 0, width, height, 0, 0, width, height);
      lastDrawnPos = pos;
      return true;
    }

    const sheet1 = getStrip(stripFor(f1));
    if (!sheet1.bitmap) {
      context.globalAlpha = 1.0;
      context.drawImage(sheet0.bitmap, (f0 % stripSize) * width, 0, width, height, 0, 0, width, height);
      lastDrawnPos = pos;
      return true;
    }

    // Hòa trộn 2 khung hình kề nhau theo tỷ lệ phần trăm chính xác (60fps/120fps motion smoothing)
    context.globalAlpha = 1.0;
    context.drawImage(sheet0.bitmap, (f0 % stripSize) * width, 0, width, height, 0, 0, width, height);
    context.globalAlpha = frac;
    context.drawImage(sheet1.bitmap, (f1 % stripSize) * width, 0, width, height, 0, 0, width, height);
    context.globalAlpha = 1.0;
    lastDrawnPos = pos;
    return true;
  }

  function tick(time) {
    request = 0;
    const elapsed = previousTime ? Math.min(time - previousTime, 40) : 16.7;
    previousTime = time;
    const delta = turnDistance(position, target);

    // ĐIỀU TIẾT VẬN TỐC TỰ NHIÊN:
    // Tốc độ cao nhưng giảm tốc cực êm dịu khi tới đích (không dừng đột ngột)
    const desiredVelocity = Math.max(-0.13, Math.min(0.13, delta / 48));
    const nextVelocity = velocity + (desiredVelocity - velocity) * (1 - Math.exp(-elapsed / 34));

    // Bước dịch chuyển mượt mà
    const step = Math.max(-2.2, Math.min(2.2, nextVelocity * elapsed));

    // Đáp đích êm ái: chỉ dừng hẳn khi khoảng cách cực nhỏ và vận tốc đã triệt tiêu
    if (Math.abs(delta) < 0.05 && Math.abs(nextVelocity) < 0.008) {
      position = target;
      velocity = 0;
      previousTime = 0;
      drawContinuous(target);
      return;
    }

    const next = wrap(position + step);
    if (drawContinuous(next)) {
      position = next;
      velocity = nextVelocity;
    }

    if (Math.abs(turnDistance(position, target)) >= 0.05 || Math.abs(velocity) >= 0.008) {
      request = requestAnimationFrame(tick);
    } else {
      position = target;
      velocity = 0;
      previousTime = 0;
      drawContinuous(target);
    }
  }

  function moveTo(frame) {
    if (target === frame && Math.abs(turnDistance(position, frame)) < 0.05) return;
    target = frame;
    if (ready && !request) request = requestAnimationFrame(tick);
  }

  function idle() {
    clearTimeout(idleTimer);
    if (paused || reduced.matches) {
      moveTo(Math.abs(distance(position, 0)) < Math.abs(distance(position, 210)) ? 0 : 210);
      return;
    }
    moveTo(workPose);
  }

  function follow(event) {
    if (!ready || paused || reduced.matches) return;

    const bounds = canvas.getBoundingClientRect();
    // Tọa độ mắt nhân vật trên màn hình (~38% từ đỉnh canvas)
    const headX = bounds.left + bounds.width * 0.5;
    const headY = bounds.top + bounds.height * 0.38;

    const dx = event.clientX - headX;
    const dy = event.clientY - headY;
    const dist = Math.hypot(dx, dy);

    // PHẠM VI TƯƠNG TÁC TẬP TRUNG GẦN NHÂN VẬT (~500px)
    const maxActiveRange = Math.min(window.innerWidth * 0.44, 520);

    if (dist > maxActiveRange) {
      // Khi chuột ở quá xa nhân vật, từ từ quay lại gõ phím bên laptop
      clearTimeout(idleTimer);
      idleTimer = setTimeout(idle, 950);
      return;
    }

    clearTimeout(idleTimer);
    idleTimer = setTimeout(idle, inactivityDelay);

    // Khi con trỏ chuột ở sát khuôn mặt (< 50px), nhìn thẳng chính diện vào người dùng (pose 0)
    if (dist < bounds.width * 0.085) {
      moveTo(0);
      return;
    }

    // Góc thực tế từ mắt nhân vật tới vị trí con chuột
    const angle = (Math.atan2(dy, dx) + 2 * Math.PI) % (2 * Math.PI);

    // Ánh xạ liên tục 360 độ từ góc chuột sang frame mục tiêu mượt mà, không giật nấc
    const nextTarget = getContinuousPose(angle);
    moveTo(nextTarget);
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
      cancelAnimationFrame(request);
      request = previousTime = velocity = 0;
      getStrip(0).loaded.then(() => {
        if (reduced.matches && drawContinuous(0)) position = target = 0;
      });
    } else {
      idle();
    }
  }

  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch' || event.pointerId === touchId) follow(event);
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    if (!reduced.matches) idle();
  });
  window.addEventListener('blur', () => {
    if (!reduced.matches) idle();
  });

  // Hỗ trợ cảm ứng
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
    if (!drawContinuous(0)) return;
    ready = true;
    stage.classList.add('avatar-ready');
    refresh();

    // Nạp sẵn toàn bộ 15 dải ảnh vào RAM ngay sau khi khởi tạo
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadAllStrips);
    } else {
      setTimeout(preloadAllStrips, 60);
    }
  });
})();
