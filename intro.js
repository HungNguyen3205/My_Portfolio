(() => {
  const dialog = document.getElementById('portfolio-intro');
  const splash = document.getElementById('intro-splash');
  const videoWrap = document.getElementById('intro-video-wrap');
  const video = document.getElementById('portfolio-intro-video');
  const startBtn = document.getElementById('splash-start');
  const skipDirectBtn = document.getElementById('splash-skip');
  const skipBtn = document.getElementById('intro-skip-btn');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  if (!dialog || typeof dialog.showModal !== 'function' || reduced.matches || location.hash) return;

  const sessionKey = 'portfolio-intro-seen';
  try {
    if (sessionStorage.getItem(sessionKey)) return;
  } catch {
    // Cho phép chạy khi storage không khả dụng
  }

  let finished = false;
  let timeout;

  // Phát âm thanh intro êm dịu chuẩn âm học qua Web Audio API khi người dùng click Splash
  function playCinematicChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      // Hợp âm ấm áp: C4 (261.63Hz), G4 (392.00Hz), C5 (523.25Hz), E5 (659.25Hz)
      const notes = [261.63, 392.00, 523.25, 659.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.07 / notes.length, now + 0.12 + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.7);
      });
    } catch {}
  }

  function finish(animate = true) {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    if (video) video.pause();
    try { sessionStorage.setItem(sessionKey, '1'); } catch {}

    if (animate && !reduced.matches) {
      document.body.classList.add('intro-reveal');
      setTimeout(() => dialog.close(), 800);
      setTimeout(() => document.body.classList.remove('intro-reveal'), 1240);
    } else {
      dialog.close();
    }
  }

  // Khởi động phát video khi người dùng click Splash (User Gesture cho phép phát âm thanh 100%)
  function startExperience() {
    playCinematicChime();

    if (splash) splash.classList.add('is-hidden');
    setTimeout(() => {
      if (splash) splash.hidden = true;
      if (videoWrap) videoWrap.hidden = false;

      // Vì đây là hành động click trực tiếp của người dùng, trình duyệt cho phép bật âm thanh!
      video.muted = false;
      video.volume = 1.0;
      video.src = 'assets/portfolio-intro.mp4';
      timeout = setTimeout(() => finish(true), 18000);

      video.addEventListener('ended', () => finish(true), { once: true });
      video.addEventListener('error', () => finish(false), { once: true });

      video.play().catch(error => {
        console.warn('Video audio play error, falling back to muted:', error);
        video.muted = true;
        video.play().catch(() => finish(false));
      });
    }, 250);
  }

  dialog.addEventListener('close', () => {
    document.body.classList.remove('intro-open');
    document.body.classList.remove('intro-reveal');
  });
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    finish();
  });

  if (startBtn) startBtn.addEventListener('click', startExperience);
  if (skipDirectBtn) skipDirectBtn.addEventListener('click', () => finish(true));
  if (skipBtn) skipBtn.addEventListener('click', () => finish(true));

  reduced.addEventListener('change', () => { if (reduced.matches) finish(false); });

  // Hiển thị dialog splash
  dialog.showModal();
  document.body.classList.add('intro-open');
})();
