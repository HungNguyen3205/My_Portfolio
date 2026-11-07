import {
  Mesh, MeshBasicMaterial, OrthographicCamera, PlaneGeometry, Scene,
  SRGBColorSpace, Texture, WebGLRenderer,
} from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

async function mountPortrait() {
  const stage = document.getElementById('avatar-stage');
  const hero = stage.closest('.hero');
  const canvas = stage.querySelector('canvas');
  const portrait = stage.querySelector('.avatar-fallback');
  const button = document.getElementById('avatar-motion');
  const caption = document.getElementById('avatar-caption');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  await portrait.decode();

  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  const scene = new Scene();
  const aspect = portrait.naturalWidth / portrait.naturalHeight;
  const camera = new OrthographicCamera(-aspect / 2, aspect / 2, 0.5, -0.5, 0.1, 10);
  camera.position.z = 2;
  const texture = new Texture(portrait);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  const geometry = new PlaneGeometry(aspect, 1, 112, 84);
  const vertices = geometry.attributes.position;
  const original = vertices.array.slice();
  const depth = new Float32Array(vertices.count);
  const eyes = new Float32Array(vertices.count);
  const falloff = (x, y, cx, cy, rx, ry) => {
    const radius = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    return Math.max(0, 1 - radius) ** 2;
  };

  for (let i = 0; i < vertices.count; i++) {
    const u = original[i * 3] / aspect + 0.5;
    const v = 0.5 - original[i * 3 + 1];
    depth[i] = 0.17 * falloff(u, v, 0.50, 0.25, 0.15, 0.25);
    eyes[i] = Math.max(
      falloff(u, v, 0.466, 0.305, 0.026, 0.021),
      falloff(u, v, 0.542, 0.305, 0.026, 0.021),
    );
  }

  const material = new MeshBasicMaterial({ map: texture, transparent: true });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;
  let request = 0;
  let lastTime = 0;
  let idleTimer;
  let paused = false;
  let lost = false;

  function draw() {
    for (let i = 0; i < vertices.count; i++) {
      const offset = i * 3;
      vertices.setXYZ(i,
        original[offset] + x * (depth[i] * 0.22 + eyes[i] * 0.005),
        original[offset + 1] - y * (depth[i] * 0.15 + eyes[i] * 0.003),
        depth[i],
      );
    }
    vertices.needsUpdate = true;
    renderer.render(scene, camera);
  }

  function animate(time) {
    request = 0;
    const dt = lastTime ? Math.min(40, time - lastTime) : 16;
    const blend = 1 - Math.exp(-dt / 105);
    x += (targetX - x) * blend;
    y += (targetY - y) * blend;
    if (Math.hypot(targetX - x, targetY - y) > 0.002) {
      lastTime = time;
      request = requestAnimationFrame(animate);
    } else {
      x = targetX;
      y = targetY;
      lastTime = 0;
    }
    draw();
  }

  function aim(nextX, nextY) {
    targetX = nextX;
    targetY = nextY;
    if (!request && !lost) request = requestAnimationFrame(animate);
  }

  function idle() {
    clearTimeout(idleTimer);
    aim(0, paused || reduced.matches ? 0 : 0.32);
  }

  function resize() {
    if (lost) return;
    const bounds = portrait.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(bounds.width, bounds.height, false);
    draw();
  }

  function refresh() {
    const stopped = paused || reduced.matches;
    button.disabled = reduced.matches;
    button.setAttribute('aria-pressed', String(stopped));
    button.setAttribute('aria-label', stopped ? 'Bật chuyển động nhân vật' : 'Tạm dừng chuyển động nhân vật');
    button.textContent = stopped ? '▶' : 'Ⅱ';
    caption.textContent = stopped ? 'Chuyển động đã tạm dừng' : 'Rê chuột để Hùng nhìn theo';
    if (reduced.matches) {
      clearTimeout(idleTimer);
      cancelAnimationFrame(request);
      request = lastTime = x = y = targetX = targetY = 0;
      draw();
    } else {
      idle();
    }
  }

  hero.addEventListener('pointermove', event => {
    if (paused || reduced.matches || lost || event.pointerType === 'touch') return;
    const bounds = hero.getBoundingClientRect();
    const clamp = value => Math.max(-1, Math.min(1, value));
    aim(clamp(2 * (event.clientX - bounds.left) / bounds.width - 1),
      clamp(2 * (event.clientY - bounds.top) / bounds.height - 1));
    clearTimeout(idleTimer);
    idleTimer = setTimeout(idle, 850);
  }, { passive: true });
  hero.addEventListener('pointerleave', idle);
  button.addEventListener('click', () => {
    paused = !paused;
    refresh();
  });
  reduced.addEventListener('change', refresh);
  const observer = new ResizeObserver(resize);
  observer.observe(portrait);
  canvas.addEventListener('webglcontextlost', () => {
    lost = true;
    cancelAnimationFrame(request);
    clearTimeout(idleTimer);
    observer.disconnect();
    stage.classList.remove('avatar-ready');
  });

  resize();
  stage.classList.add('avatar-ready');
  refresh();
}

mountPortrait().catch(() => {
  // The original portrait remains visible when WebGL is unavailable.
});
