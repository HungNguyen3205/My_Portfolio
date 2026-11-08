/* Màn mở đầu liền mạch:
   màn chọn → (mờ dần, phóng nhẹ) → video lời chào có nhạc → (gần hết video, lớp intro mờ dần)
   → nhân vật tương tác bên dưới "tiếp nối" nhân vật trong video, liếc chào rồi nhìn theo chuột. */
(() => {
  const dialog = document.getElementById('portfolio-intro');
  const splash = document.getElementById('intro-splash');
  const videoWrap = document.getElementById('intro-video-wrap');
  const video = document.getElementById('portfolio-intro-video');
  const choiceNo = document.getElementById('game-choice-no');
  const choiceYes = document.getElementById('game-choice-yes');
  const runnerChar = document.getElementById('runner-character');
  const speechFill = document.getElementById('speech-fill');
  const speechSkip = document.getElementById('speech-skip');
  const skipBtn = document.getElementById('intro-skip-btn');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  if (!dialog || typeof dialog.showModal !== 'function' || !video) return;
  // Intro hiện MỖI LẦN mở trang. Chỉ bỏ qua khi mở thẳng một mục bằng link có # (vd: .../#archive).

  const REVEAL_BEFORE_END = 1.15; // giây: bắt đầu hòa vào trang trước khi video kết thúc
  const FADE_MS = 1100;
  let finished = false;
  let chosen = false;   // chặn bấm hai lần / bấm cả hai nút
  let timeout;
  let audioCtx = null;

  function ctx() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      audioCtx = audioCtx || new AudioCtx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch { return null; }
  }

  function tone(c, freq, start, peak, length, type = 'triangle') {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(start); osc.stop(start + length + 0.02);
  }

  // "Chưa": chuỗi nốt tinh nghịch (cùng giọng Fa trưởng với nhạc video)
  function playPlayfulSound() {
    const c = ctx(); if (!c) return;
    const now = c.currentTime;
    [349.23, 440.0, 523.25, 659.25, 698.46].forEach((f, i) => tone(c, f, now + i * 0.07, 0.07, 0.16));
  }

  // "Rồi!": tiếng chuông mở màn ngắn, hòa vào nhạc nền của video
  function playStartChime() {
    const c = ctx(); if (!c) return;
    const now = c.currentTime;
    [349.23, 523.25, 698.46].forEach((f, i) => tone(c, f, now + i * 0.05, 0.05, 0.9, i ? 'triangle' : 'sine'));
  }

  /* Khung cuối video có CÙNG bố cục với khung nhân vật trên trang (845×700px, lệch 193px theo chiều ngang
     trong khung 1280×720). Tính phép thu nhỏ + dịch để vùng nhân vật trong video chồng khít lên nhân vật
     trên trang. */
  const VIDEO_W = 1280, VIDEO_H = 720, FRAME_W = 880, FRAME_X = 193;
  function setMorph() {
    const target = document.querySelector('#avatar-stage .avatar-fallback');
    if (!target) return;
    const r = target.getBoundingClientRect();
    const box = video.getBoundingClientRect();
    if (!r.width || !box.width) return;
    const sv = Math.min(box.width / VIDEO_W, box.height / VIDEO_H);           // object-fit: contain
    const ox = (box.width - VIDEO_W * sv) / 2, oy = (box.height - VIDEO_H * sv) / 2;
    const k = r.width / (FRAME_W * sv);
    const tx = r.left - box.left - k * (ox + FRAME_X * sv);
    const ty = r.top - box.top - k * oy;
    video.style.setProperty('--morph', `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${k.toFixed(4)})`);
  }

  function finish(animate = true) {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    // Báo cho nhân vật tương tác: lời chào xong, bắt đầu liếc chào & nhìn theo chuột
    dispatchEvent(new CustomEvent('portfolio:intro-done'));

    if (animate && !reduced.matches) {
      // Video vẫn chạy nốt trong lúc chuyển cảnh → không có khoảng "đứng hình"
      setMorph();
      document.body.classList.add('intro-reveal');
      setTimeout(() => { dialog.close(); video.pause(); }, FADE_MS);
      setTimeout(() => document.body.classList.remove('intro-reveal'), FADE_MS + 500);
    } else {
      video.pause();
      dialog.close();
    }
  }

  // Video lời chào: nhân vật vẫy tay chào, đi vào văn phòng rồi ngồi xuống bàn làm việc.
  function playGreeting() {
    if (splash) splash.hidden = true;
    if (videoWrap) { videoWrap.hidden = false; videoWrap.classList.remove('is-playing'); }
    video.style.removeProperty('--morph');

    // Phát ngay sau cú click của người xem nên trình duyệt cho phép bật tiếng.
    video.muted = false;
    video.volume = 1.0;
    if (!video.src.includes('portfolio-intro.mp4')) video.src = 'assets/portfolio-intro.mp4';
    try { video.currentTime = 0; } catch {}
    timeout = setTimeout(() => finish(true), 18000); // lưới an toàn nếu video không chạy

    const onPlaying = () => videoWrap && videoWrap.classList.add('is-playing');
    const onTime = () => {
      if (video.duration && video.currentTime >= video.duration - REVEAL_BEFORE_END) {
        video.removeEventListener('timeupdate', onTime);
        finish(true);
      }
    };
    video.addEventListener('playing', onPlaying, { once: true });
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('ended', () => finish(true), { once: true });
    video.addEventListener('error', () => finish(false), { once: true });

    video.play().catch(error => {
      console.warn('Video audio play error, falling back to muted:', error);
      video.muted = true;
      video.play().catch(() => finish(false));
    });
  }

  // Màn chọn mờ dần + phóng nhẹ, đồng thời video hiện lên từ bóng tối
  function toVideo(delay) {
    if (splash) splash.classList.add('is-hidden');
    setTimeout(playGreeting, delay);
  }

  function lockChoices() {
    chosen = true;
    if (choiceNo) choiceNo.disabled = true;
    if (choiceYes) choiceYes.disabled = true;
  }

  // "Rồi!": vào thẳng video lời chào
  function onChooseYes() {
    if (chosen) return;
    lockChoices();
    playStartChime();
    toVideo(380);
  }

  // "Chưa": trêu một câu rồi vẫn dẫn vào video lời chào
  function onChooseNo() {
    if (chosen) return;
    lockChoices();
    playPlayfulSound();
    if (runnerChar) runnerChar.classList.add('is-happy');
    const dialogue = document.getElementById('game-dialogue');
    const response = document.getElementById('game-response');
    if (dialogue) dialogue.hidden = true;
    if (response) {
      response.hidden = false;
      setTimeout(() => { if (speechFill) speechFill.style.width = '100%'; }, 30);
    }
    timeout = setTimeout(() => toVideo(380), 1700);
  }

  // Nút "Xem lại lời chào" ở chân hero: mở thẳng video, không hỏi lại.
  function replay() {
    if (dialog.open) return;
    finished = false;
    chosen = true;
    clearTimeout(timeout);
    document.body.classList.remove('intro-reveal');
    if (splash) splash.hidden = true;
    dialog.showModal();
    document.body.classList.add('intro-open');
    playGreeting();
  }
  document.querySelectorAll('[data-replay-intro]').forEach(btn => btn.addEventListener('click', replay));

  dialog.addEventListener('close', () => {
    document.body.classList.remove('intro-open');
  });
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    finish();
  });

  if (choiceNo) choiceNo.addEventListener('click', onChooseNo);
  if (choiceYes) choiceYes.addEventListener('click', onChooseYes);
  if (speechSkip) speechSkip.addEventListener('click', () => { clearTimeout(timeout); toVideo(200); });
  if (skipBtn) skipBtn.addEventListener('click', () => finish(true));

  reduced.addEventListener('change', () => { if (reduced.matches && dialog.open) finish(false); });

  // Hiển thị màn chọn (trừ khi mở thẳng một mục bằng link có #)
  if (!location.hash) {
    dialog.showModal();
    document.body.classList.add('intro-open');
  }
})();
