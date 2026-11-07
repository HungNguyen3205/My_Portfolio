(() => {
  const dialog = document.getElementById('portfolio-intro');
  const video = document.getElementById('portfolio-intro-video');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!dialog || typeof dialog.showModal !== 'function' || reduced.matches || location.hash) return;

  const sessionKey = 'portfolio-intro-seen';
  try {
    if (sessionStorage.getItem(sessionKey)) return;
  } catch {
    // The intro can still run when browser storage is unavailable.
  }

  let finished = false;
  let timeout;
  function finish(animate = true) {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    video.pause();
    try { sessionStorage.setItem(sessionKey, '1'); } catch {}

    if (animate && !reduced.matches) {
      document.body.classList.add('intro-reveal');
      setTimeout(() => dialog.close(), 800);
      setTimeout(() => document.body.classList.remove('intro-reveal'), 1240);
    } else {
      dialog.close();
    }
  }

  dialog.addEventListener('close', () => document.body.classList.remove('intro-open'));
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    finish();
  });
  dialog.querySelector('button').addEventListener('click', () => finish());
  video.addEventListener('ended', () => finish());
  video.addEventListener('error', () => finish(false));
  reduced.addEventListener('change', () => { if (reduced.matches) finish(false); });
  dialog.showModal();
  document.body.classList.add('intro-open');
  video.muted = true;
  video.src = 'assets/portfolio-intro.mp4';
  timeout = setTimeout(() => finish(false), 16000);
  video.play().catch(() => finish(false));
})();
