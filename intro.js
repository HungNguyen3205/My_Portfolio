(() => {
  const dialog = document.getElementById('portfolio-intro');
  const splash = document.getElementById('intro-splash');
  const videoWrap = document.getElementById('intro-video-wrap');
  const video = document.getElementById('portfolio-intro-video');
  const choiceNo = document.getElementById('game-choice-no');
  const choiceYes = document.getElementById('game-choice-yes');
  const runnerChar = document.getElementById('runner-character');
  const runnerSpeech = document.getElementById('runner-speech');
  const speechFill = document.getElementById('speech-fill');
  const speechSkip = document.getElementById('speech-skip');
  const skipBtn = document.getElementById('intro-skip-btn');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  if (!dialog || typeof dialog.showModal !== 'function' || location.hash) return;

  const sessionKey = 'portfolio-intro-seen';
  try {
    if (sessionStorage.getItem(sessionKey)) return;
  } catch {
    // Cho phép chạy khi storage không khả dụng
  }

  let finished = false;
  let timeout;

  // Âm thanh vui tươi, hóm hỉnh 8-bit khi bấm "Chưa"
  function playPlayfulSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      // Dãy nốt luyến vui vẻ: F4 -> A4 -> C5 -> E5 -> G5
      const notes = [349.23, 440.00, 523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);

        gain.gain.setValueAtTime(0.0001, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.08, now + i * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.18);
      });
    } catch {}
  }

  // Âm thanh cinematic chào đón khi bấm "Rồi!"
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

  // Khi chọn "Chưa": Hiện câu thoại trêu đùa và tự động vào portfolio
  function onChooseNo() {
    playPlayfulSound();

    if (runnerChar) runnerChar.classList.add('is-happy');
    const dialogue = document.getElementById('game-dialogue');
    const response = document.getElementById('game-response');
    if (dialogue) dialogue.hidden = true;
    if (response) {
      response.hidden = false;
      setTimeout(() => {
        if (speechFill) speechFill.style.width = '100%';
      }, 30);
    }

    // Sau 1.8s tự động vào trang chính
    timeout = setTimeout(() => finish(true), 1800);
  }

  // Khi chọn "Rồi!": Bắt đầu phát video VỚI ĐẦY ĐỦ ÂM THANH
  function onChooseYes() {
    playCinematicChime();

    if (splash) splash.classList.add('is-hidden');
    setTimeout(() => {
      if (splash) splash.hidden = true;
      if (videoWrap) videoWrap.hidden = false;

      // Vì là thao tác click trực tiếp từ người dùng, trình duyệt cho phép bật âm thanh 100%!
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

  if (choiceNo) choiceNo.addEventListener('click', onChooseNo);
  if (choiceYes) choiceYes.addEventListener('click', onChooseYes);
  if (speechSkip) speechSkip.addEventListener('click', () => finish(true));
  if (skipBtn) skipBtn.addEventListener('click', () => finish(true));

  reduced.addEventListener('change', () => { if (reduced.matches) finish(false); });

  // Hiển thị dialog splash
  dialog.showModal();
  document.body.classList.add('intro-open');
})();
