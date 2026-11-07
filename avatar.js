(() => {
  const stage = document.getElementById('avatar-stage');
  if (!stage) return;

  const hero = stage.closest('.hero');
  const character = stage.querySelector('.avatar-character');
  const controls = hero.querySelector('.avatar-controls');
  const directions = [...controls.querySelectorAll('[data-gaze]')];
  const motion = document.getElementById('avatar-motion');
  const caption = document.getElementById('avatar-caption');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(any-hover: hover)');
  let paused = false;
  let selected = null;

  function showPose(x, y) {
    character.style.setProperty('--gaze-x', `${x * 6}px`);
    character.style.setProperty('--gaze-y', `${y * 3.5}px`);
  }

  function refresh() {
    const stopped = paused || reduced.matches;
    motion.hidden = reduced.matches || !hover.matches;
    motion.setAttribute('aria-pressed', String(stopped));
    motion.setAttribute('aria-label', stopped ? 'Bật chuyển động theo chuột' : 'Tạm dừng chuyển động theo chuột');
    motion.textContent = stopped ? '▶' : 'Ⅱ';
    caption.textContent = stopped || !hover.matches
      ? 'Chọn hướng nhìn'
      : 'Rê chuột hoặc chọn hướng nhìn';
    if (!selected) showPose(0, 0);
  }

  const sprite = new Image();
  sprite.src = 'assets/hung-states.webp';
  sprite.decode().then(() => {
    if (sprite.naturalWidth !== 1536 || sprite.naturalHeight !== 1024) return;

    for (const button of directions) {
      button.addEventListener('click', () => {
        selected = selected === button ? null : button;
        for (const direction of directions) {
          direction.setAttribute('aria-pressed', String(direction === selected));
        }
        showPose(...(selected ? selected.dataset.gaze.split(',').map(Number) : [0, 0]));
      });
    }

    const clamp = value => Math.max(-1, Math.min(1, value));
    stage.addEventListener('pointermove', event => {
      if (selected || paused || reduced.matches || event.pointerType === 'touch') return;
      const bounds = stage.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      showPose(clamp(x * 2.6), clamp(y * 2.6));
    }, { passive: true });
    stage.addEventListener('pointerleave', () => {
      if (!selected) showPose(0, 0);
    });
    motion.addEventListener('click', () => {
      paused = !paused;
      refresh();
    });
    reduced.addEventListener('change', refresh);
    hover.addEventListener('change', refresh);

    stage.classList.add('avatar-ready');
    controls.hidden = false;
    refresh();
  }).catch(() => {
    // The approved portrait stays visible if the sprite cannot load.
  });
})();
