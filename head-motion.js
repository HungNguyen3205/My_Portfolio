import * as THREE from 'three';

export function prepareHead(model) {
  model.updateMatrixWorld(true);
  const mesh = model.getObjectByProperty('isMesh', true);
  const { geometry } = mesh;
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const index = geometry.index.array;
  const roots = Int32Array.from({ length: position.count }, (_, i) => i);

  function root(i) {
    while (roots[i] !== i) {
      roots[i] = roots[roots[i]];
      i = roots[i];
    }
    return i;
  }
  function join(a, b) {
    roots[root(a)] = root(b);
  }

  const seams = new Map();
  for (let i = 0; i < position.count; i++) {
    const key = [position.getX(i), position.getY(i), position.getZ(i)]
      .map(value => Math.round(value * 32767)).join(',');
    if (seams.has(key)) join(i, seams.get(key));
    else seams.set(key, i);
  }
  for (let i = 0; i < index.length; i += 3) {
    join(index[i], index[i + 1]);
    join(index[i], index[i + 2]);
  }
  const counts = new Map();
  let body = 0;
  for (let i = 0; i < position.count; i++) {
    const id = root(i);
    counts.set(id, (counts.get(id) || 0) + 1);
    if (counts.get(id) > (counts.get(body) || 0)) body = id;
  }

  const basePosition = new Float32Array(position.count * 3);
  const baseNormal = new Float32Array(normal.count * 3);
  const moving = [];
  const point = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i).toArray(basePosition, i * 3);
    point.fromBufferAttribute(normal, i).toArray(baseNormal, i * 3);
    if (root(i) !== body) continue;
    point.applyMatrix4(mesh.matrixWorld);
    const weight = THREE.MathUtils.smoothstep(point.y, 0.415, 0.515);
    if (weight > 0) moving.push({ i, weight });
  }
  if (moving.length < 1000) throw new Error('Head region could not be identified');

  const positions = new THREE.BufferAttribute(basePosition.slice(), 3).setUsage(THREE.DynamicDrawUsage);
  const normals = new THREE.BufferAttribute(baseNormal.slice(), 3).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', positions);
  geometry.setAttribute('normal', normals);
  mesh.frustumCulled = false;

  const pivot = mesh.worldToLocal(new THREE.Vector3(0, 0.438, -0.025));
  const world = mesh.getWorldQuaternion(new THREE.Quaternion());
  const inverse = world.clone().invert();
  const rotation = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const result = new THREE.Vector3();

  return (yaw, pitch) => {
    rotation.setFromEuler(euler.set(pitch, yaw, 0)).premultiply(inverse).multiply(world);
    for (const { i, weight } of moving) {
      point.fromArray(basePosition, i * 3);
      result.copy(point).sub(pivot).applyQuaternion(rotation).add(pivot);
      point.lerp(result, weight);
      positions.setXYZ(i, point.x, point.y, point.z);
      point.fromArray(baseNormal, i * 3);
      result.copy(point).applyQuaternion(rotation);
      point.lerp(result, weight).normalize();
      normals.setXYZ(i, point.x, point.y, point.z);
    }
    positions.needsUpdate = normals.needsUpdate = true;
  };
}
