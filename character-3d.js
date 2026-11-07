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
  const face = sphere.clone();
  const points = face.attributes.position;
  for (let i = 0; i < points.count; i++) {
    const y = points.getY(i);
    const jaw = THREE.MathUtils.smoothstep(y, -0.95, -0.05);
    points.setXYZ(i, points.getX(i) * (0.72 + 0.28 * jaw), y, points.getZ(i));
  }
  face.computeVertexNormals();
  part(head, face, skin, 0, 0.57, 0, 0.58, 0.73, 0.53);
  ball(head, skin, 0, 0.45, 0.507, 0.066, 0.105, 0.066);
  ball(head, skin, 0, 0.414, 0.543, 0.078, 0.041, 0.043);

  function strand(parent, surface, coordinates, radius, segments = 18) {
    const path = new THREE.CatmullRomCurve3(coordinates.map(point => new THREE.Vector3(...point)));
    const tube = new THREE.TubeGeometry(path, segments, radius, 8);
    const positions = tube.attributes.position;
    for (let ring = 0; ring <= segments; ring++) {
      const t = ring / segments;
      const center = path.getPointAt(t);
      const taper = 0.12 + 0.88 * Math.sin(Math.PI * t) ** 0.45;
      for (let vertex = 0; vertex < 9; vertex++) {
        const i = ring * 9 + vertex;
        positions.setXYZ(i, center.x + (positions.getX(i) - center.x) * taper,
          center.y + (positions.getY(i) - center.y) * taper,
          center.z + (positions.getZ(i) - center.z) * taper);
      }
    }
    tube.computeVertexNormals();
    parent.add(new THREE.Mesh(tube, surface));
  }

  strand(head, material(0x984c43), [[-.145,.252,.452],[-.065,.229,.474],[0,.223,.481],[.065,.229,.474],[.145,.252,.452]], .013);

  ball(head, hair, 0, 1.02, -0.04, 0.61, 0.38, 0.54);
  for (const side of [-1, 1]) {
    for (let row = 0; row < 5; row++) {
      for (let lock = 0; lock < 5; lock++) {
        const lift = row * 0.052 + lock * 0.024;
        const z = 0.49 - row * 0.12;
        const spread = lock * 0.035;
        strand(head, (row + lock) % 4 === 0 ? hairLight : hair, [
          [side * (.018 + spread), 1.08 + lift, z],
          [side * (.15 + spread), 1.24 + lift, z + .045],
          [side * (.32 + spread), 1.20 + lift, z + .028],
          [side * (.49 + spread * .65), 1.04 + lift, z - .025],
          [side * (.56 + spread * .45), .84 + lift, z - .095],
        ], .051 - lock * .004);
      }
    }
    strand(head, hair, [[side*.045,1.15,.49],[side*.091,1.04,.536],[side*.083,.94,.548],[side*.103,.84,.51]], .017);
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
    ball(eye, white, 0, 0, 0, 0.135, 0.060, 0.040);
    const pupil = new THREE.Group();
    eye.add(pupil);
    ball(pupil, iris, 0, 0, 0.038, 0.052, 0.054, 0.016);
    ball(pupil, black, 0, 0, 0.05, 0.028, 0.031, 0.01);
    ball(pupil, white, -0.019, 0.024, 0.058, 0.01, 0.011, 0.005);
    eyes.push({ eye, pupil });
  }

  const arms = [-1, 1].map(side => {
    const arm = new THREE.Group();
    arm.name = side < 0 ? 'Arm screen left' : 'Arm screen right';
    arm.position.set(side * 0.65, 0.72, 0.38);
    model.add(arm);
    const sleeve = ball(arm, shirt, side * 0.065, 0.15, -0.035, 0.27, 0.34, 0.28);
    sleeve.rotation.z = side * 0.35;
    const hand = ball(arm, skin, -side * 0.13, -0.16, 0.25, 0.36, 0.13, 0.13);
    hand.rotation.y = side * 0.45;
    return arm;
  });
  for (const side of [-1, 1]) {
    const collar = block(model, shirt, side * .19, 1.38, .40, .28, .18, .045);
    collar.rotation.z = side * .42;
  }
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

