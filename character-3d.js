import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const stage = document.querySelector('#stage');
const status = document.querySelector('#status');
const exportButton = document.querySelector('#export');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

function mount() {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 40);
  camera.position.set(0, 1.65, 7.8);
  camera.lookAt(0, 1.49, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa7c8, 2.2));
  const key = new THREE.DirectionalLight(0xfff0dc, 2.7);
  key.position.set(-3, 5, 6);
  scene.add(key);

  const model = new THREE.Group();
  model.name = 'Portfolio developer';
  scene.add(model);

  const sphere = new THREE.SphereGeometry(1, 28, 20);
  const box = new THREE.BoxGeometry();
  const material = (color, roughness = 0.65) => new THREE.MeshStandardMaterial({ color, roughness });
  const skin = material(0xe8a17f);
  const shirt = material(0x333743);
  const hair = material(0x30201d);
  const hairLight = material(0x49312b);
  const white = material(0xfff6ed);
  const iris = material(0x63412d, 0.35);
  const black = material(0x211719, 0.25);
  const metal = material(0x9b9fb3, 0.4);

  function part(parent, geometry, surface, x, y, z, sx, sy, sz) {
    const mesh = new THREE.Mesh(geometry, surface);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    parent.add(mesh);
    return mesh;
  }
  const ball = (parent, surface, ...pose) => part(parent, sphere, surface, ...pose);
  const block = (parent, surface, ...pose) => part(parent, box, surface, ...pose);

  ball(model, shirt, 0, 1.04, -0.29, 1.05, 0.89, 0.32);
  ball(model, shirt, 0, 0.87, 0.11, 0.93, 0.67, 0.38);
  ball(model, skin, 0, 1.47, 0.12, 0.22, 0.36, 0.22);

  const head = new THREE.Group();
  head.name = 'Head pivot';
  head.position.set(0, 1.57, 0.16);
  model.add(head);
  ball(head, skin, 0, 0.57, 0, 0.61, 0.71, 0.53);
  ball(head, skin, 0, 0.29, 0.16, 0.46, 0.39, 0.38);
  ball(head, skin, 0, 0.45, 0.51, 0.095, 0.105, 0.13);
  ball(head, material(0xad5d56), 0, 0.23, 0.484, 0.15, 0.025, 0.036);

  ball(head, hair, 0, 0.96, -0.05, 0.65, 0.44, 0.56);
  for (let i = 0; i < 13; i++) {
    const t = i / 12;
    const lock = ball(head, i % 3 ? hair : hairLight,
      (t - 0.5) * 1.13, 0.93 + Math.sin(t * Math.PI) * 0.24,
      0.29 + Math.sin(t * Math.PI) * 0.15, 0.19, 0.29, 0.18);
    lock.rotation.z = 0.46 - t * 1.25;
  }

  const eyes = [];
  for (const side of [-1, 1]) {
    ball(head, skin, side * 0.59, 0.51, 0.015, 0.12, 0.18, 0.12);
    const eyebrow = ball(head, hair, side * 0.225, 0.72, 0.472, 0.17, 0.037, 0.04);
    eyebrow.rotation.z = side * 0.14;
    const eye = new THREE.Group();
    eye.name = side < 0 ? 'Eye screen left' : 'Eye screen right';
    eye.position.set(side * 0.224, 0.567, 0.469);
    head.add(eye);
    ball(eye, white, 0, 0, 0, 0.151, 0.088, 0.071);
    const pupil = new THREE.Group();
    eye.add(pupil);
    ball(pupil, iris, 0, 0, 0.066, 0.061, 0.065, 0.026);
    ball(pupil, black, 0, 0, 0.086, 0.032, 0.036, 0.012);
    ball(pupil, white, -0.019, 0.024, 0.096, 0.012, 0.013, 0.006);
    eyes.push({ eye, pupil });
  }

  const arms = [-1, 1].map(side => {
    const arm = new THREE.Group();
    arm.name = side < 0 ? 'Arm screen left' : 'Arm screen right';
    arm.position.set(side * 0.65, 0.72, 0.38);
    model.add(arm);
    const sleeve = ball(arm, shirt, side * 0.065, 0.15, -0.035, 0.27, 0.34, 0.28);
    sleeve.rotation.z = side * 0.35;
    const hand = ball(arm, skin, -side * 0.13, -0.16, 0.37, 0.36, 0.13, 0.16);
    hand.rotation.y = side * 0.45;
    return arm;
  });
  block(model, metal, 0, 0.45, 0.91, 1.42, 0.76, 0.065).rotation.x = -0.12;
  block(model, shirt, 0, 0.10, 0.56, 1.43, 0.06, 0.76);
  block(model, shirt, 0, 0.45, 0.951, 0.16, 0.13, 0.012);

  let pointerX = 0, pointerY = 0, lastMove = -Infinity, lastFrame = 0;
  const clamp = value => Math.max(-1, Math.min(1, value));
  stage.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const bounds = stage.getBoundingClientRect();
    pointerX = clamp((event.clientX - bounds.left) / bounds.width * 2 - 1);
    pointerY = clamp((event.clientY - bounds.top) / bounds.height * 2 - 1);
    lastMove = performance.now();
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { lastMove = -Infinity; });

  function render(time) {
    const dt = Math.min((time - lastFrame) / 1000, 0.05);
    lastFrame = time;
    const moving = !reduced.matches;
    const tracking = moving && time - lastMove < 850;
    const x = tracking ? pointerX : 0;
    const y = tracking ? pointerY : moving ? 0.44 : 0;
    head.rotation.y = THREE.MathUtils.damp(head.rotation.y, x * 0.46, 10, dt);
    head.rotation.x = THREE.MathUtils.damp(head.rotation.x, y * 0.30, 10, dt);
    const blink = moving ? Math.max(0, 1 - Math.abs(time % 4300 - 2200) / 85) : 0;
    for (const { eye, pupil } of eyes) {
      pupil.position.x = THREE.MathUtils.damp(pupil.position.x, x * 0.044, 16, dt);
      pupil.position.y = THREE.MathUtils.damp(pupil.position.y, -y * 0.028, 16, dt);
      eye.scale.y = 1 - blink * 0.93;
    }
    arms.forEach((arm, index) => {
      const typing = moving && !tracking ? Math.sin(time / 92 + index * 2.4) * 0.045 : 0;
      arm.rotation.x = THREE.MathUtils.damp(arm.rotation.x, typing, 16, dt);
    });
    renderer.render(scene, camera);
  }

  new ResizeObserver(() => {
    const { clientWidth, clientHeight } = stage;
    if (!clientWidth || !clientHeight) return;
    camera.aspect = clientWidth / clientHeight;
    camera.position.z = 7.8 * Math.max(1, 0.72 / camera.aspect);
    camera.lookAt(0, 1.49, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight, false);
  }).observe(stage);
  stage.replaceChildren(renderer.domElement);
  renderer.setAnimationLoop(render);

  exportButton.hidden = false;
  exportButton.addEventListener('click', async () => {
    exportButton.disabled = true;
    try {
      const data = await new GLTFExporter().parseAsync(model, { binary: true });
      const url = URL.createObjectURL(new Blob([data], { type: 'model/gltf-binary' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'hung-portfolio.glb';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      exportButton.disabled = false;
    }
  });
}

try {
  mount();
} catch (error) {
  status.textContent = 'Không thể mở bản mẫu 3D trên trình duyệt này.';
  console.error(error);
}
