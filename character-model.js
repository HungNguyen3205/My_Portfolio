import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const stage = document.querySelector('#stage');
const status = document.querySelector('#status');

async function start() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, 0.01, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9caac5, 2.4));
  for (const [x, y, z] of [[3, 4, 5], [-3, 3, -5]]) {
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(x, y, z);
    scene.add(light);
  }

  const { scene: model } = await new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder).loadAsync('./assets/hung-model.glb');
  scene.add(model);
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  if (box.isEmpty() || !sphere.radius) throw new Error('Model has no visible geometry');
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(center);
  controls.enablePan = false;
  controls.minDistance = sphere.radius * 1.1;
  controls.maxDistance = sphere.radius * 12;
  controls.minPolarAngle = Math.PI / 5;
  controls.maxPolarAngle = Math.PI * 0.70;
  const render = () => renderer.render(scene, camera);
  controls.addEventListener('change', render);

  function setView(angle) {
    const vertical = THREE.MathUtils.degToRad(camera.fov / 2);
    const limit = Math.min(vertical, Math.atan(Math.tan(vertical) * camera.aspect));
    const distance = sphere.radius / Math.sin(limit) * 0.82;
    camera.position.set(center.x + Math.sin(angle) * distance,
      center.y + sphere.radius * 0.10, center.z + Math.cos(angle) * distance);
    controls.update();
    render();
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = stage;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    setView(controls.getAzimuthalAngle());
  }

  renderer.domElement.setAttribute('aria-label', 'Model 3D của nhân vật Hùng');
  stage.replaceChildren(renderer.domElement);
  resize();
  setView(0);
  new ResizeObserver(resize).observe(stage);
  for (const button of document.querySelectorAll('[data-angle]')) {
    button.disabled = false;
    button.addEventListener('click', () => setView(THREE.MathUtils.degToRad(Number(button.dataset.angle))));
  }
}

start().catch(error => {
  status.textContent = 'Không mở được model 3D. Anh vẫn có thể tải GLB bên dưới.';
  console.error(error);
});
