/* Nhân vật 3D + 8 icon 3D nổi (three.js r128).
   - Nền: assets/avatar3d/base_scene.webp (thân, laptop, đồ vật, icon — phần đầu để trống).
   - Đầu: assets/avatar3d/head_atlas_3x3.webp — lưới 6x6 = 36 tư thế, chọn theo vị trí chuột.
   - 8 icon được cắt khỏi ảnh nền thành khối 3D hai mặt, trôi nổi + parallax; rê chuột để sáng, bấm để lật.
   Nếu WebGL/ảnh lỗi → giữ nguyên ảnh tĩnh .avatar-fallback. */
(() => {
  const stage = document.getElementById('avatar-stage');
  const mount = stage && stage.querySelector('.avatar-3d');
  if (!stage || !mount || !window.THREE) return;

  const hero = stage.closest('.hero');
  const button = document.getElementById('avatar-motion');
  const caption = document.getElementById('avatar-caption');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const introOpen = () => document.body.classList.contains('intro-open');

  const IMG_W = 1447, IMG_H = 1087;
  const PAD = 0.12;            // canvas tràn ra mỗi phía 12% để icon nổi/parallax không bị cắt
  const FRONT_Y = -0.12;       // "nhìn thẳng" trên trục dọc của atlas

  const state = {
    depthScale: 1.10, parallaxScale: 1.30, mouseSensitivity: 0.85, lightIntensity: 1.10, floatSpeed: 1.00,
    mouseX: 0, mouseY: FRONT_Y, smoothMouseX: 0, smoothMouseY: FRONT_Y, velMouseX: 0, velMouseY: 0,
    targetRotX: 0, targetRotY: 0, currentRotX: 0, currentRotY: 0, velRotX: 0, velRotY: 0,
    cameraZoom: 4.8,
    scrubX: 0, scrubY: 0, activePoseIdx: 0, prevPoseIdx: 0, poseBlend: 1.0
  };

  // 36 tư thế đầu trong atlas 6x6 (gx: trái/phải, gy: trên/dưới)
  const HEAD_FRAMES_36 = [
    [0.00, 0.00], [-0.10, 0.01], [-0.18, 0.02], [-0.26, 0.02], [-0.34, 0.04], [-0.16, 0.18],
    [0.22, 0.00], [0.34, 0.02], [0.06, 0.16], [-0.46, 0.12], [-0.56, 0.10], [-0.68, 0.06],
    [-0.78, 0.03], [-0.88, 0.01], [-0.98, 0.00], [-0.92, 0.16], [-0.84, 0.28], [-0.76, 0.38],
    [-0.70, 0.48], [-0.62, 0.65], [-0.52, 0.56], [-0.42, 0.46], [-0.34, 0.36], [-0.74, -0.58],
    [-0.44, -0.82], [-0.28, -0.90], [-0.14, -0.95], [0.00, -0.98], [0.16, -0.92], [0.42, -0.82],
    [0.58, -0.72], [0.74, -0.58], [0.86, -0.42], [0.94, -0.12], [0.88, 0.08], [0.66, 0.72]
  ].map(([gx, gy], idx) => ({ idx, gx, gy }));

  // Khung bao (pixel) của 8 icon trong ảnh nền 1447x1087
  const FLOATING_LAYERS = [
    { id: 'code_win',  bbox: [108, 182, 488, 440],  baseZ: 0.46, parallaxFactor: 1.48, floatPhase: 0.0, floatAmp: 0.046, rotAmp: 0.08,  springStiff: 95,  springDamp: 14, rimColor: [0.20, 0.23, 0.34] },
    { id: 'braces',    bbox: [129, 447, 330, 633],  baseZ: 0.62, parallaxFactor: 1.68, floatPhase: 1.2, floatAmp: 0.054, rotAmp: 0.10,  springStiff: 115, springDamp: 15, rimColor: [0.18, 0.42, 0.85] },
    { id: 'sparks',    bbox: [388, 31, 503, 187],   baseZ: 0.38, parallaxFactor: 1.35, floatPhase: 2.1, floatAmp: 0.038, rotAmp: 0.09,  springStiff: 85,  springDamp: 13, rimColor: [0.22, 0.48, 0.90] },
    { id: 'cloud',     bbox: [939, 20, 1220, 211],  baseZ: 0.34, parallaxFactor: 1.28, floatPhase: 0.8, floatAmp: 0.048, rotAmp: 0.06,  springStiff: 80,  springDamp: 13, rimColor: [0.78, 0.82, 0.90] },
    { id: 'database',  bbox: [1156, 212, 1351, 405], baseZ: 0.52, parallaxFactor: 1.52, floatPhase: 3.0, floatAmp: 0.044, rotAmp: 0.085, springStiff: 100, springDamp: 14, rimColor: [0.16, 0.36, 0.78] },
    { id: 'it_badge',  bbox: [913, 281, 1150, 459], baseZ: 0.40, parallaxFactor: 1.38, floatPhase: 4.2, floatAmp: 0.040, rotAmp: 0.075, springStiff: 90,  springDamp: 14, rimColor: [0.20, 0.22, 0.30], excludeRect: [1072, 440, 1370, 670] },
    { id: 'flowchart', bbox: [1072, 440, 1372, 671], baseZ: 0.56, parallaxFactor: 1.60, floatPhase: 5.1, floatAmp: 0.050, rotAmp: 0.08,  springStiff: 108, springDamp: 15, rimColor: [0.22, 0.25, 0.36] },
    { id: 'cursor',    bbox: [1182, 674, 1331, 834], baseZ: 0.76, parallaxFactor: 1.98, floatPhase: 1.9, floatAmp: 0.060, rotAmp: 0.13,  springStiff: 135, springDamp: 16, rimColor: [0.25, 0.30, 0.42] }
  ];

  /* ---------- Three.js ---------- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) { return; }  // không có WebGL → giữ ảnh tĩnh
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  mount.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, -0.04, state.cameraZoom);
  const rigGroup = new THREE.Group();
  const reliefGroup = new THREE.Group();
  const bgParticlesGroup = new THREE.Group();
  scene.add(rigGroup, bgParticlesGroup);
  rigGroup.add(reliefGroup);

  const shaderMaterials = [];
  const floatingIconGroups = [];
  const raycastTargets = [];
  let shadowMesh = null;
  let planeHeight = 2.68;

  function mainMaterial(colorTex, depthTex, headAtlasTex) {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColorMap: { value: colorTex }, uDepthMap: { value: depthTex }, uHeadAtlas: { value: headAtlasTex },
        uDepthScale: { value: state.depthScale * 0.34 }, uLightPos: { value: new THREE.Vector3(0.5, 0.5, 1.8) },
        uLightIntensity: { value: state.lightIntensity }, uActivePose: { value: 0 }, uPrevPose: { value: 0 },
        uPoseBlend: { value: 1 }, uDeltaPrev: { value: new THREE.Vector2() }, uHeadShift: { value: new THREE.Vector2() }
      },
      vertexShader: `
        uniform sampler2D uDepthMap; uniform float uDepthScale;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position; p.z += texture2D(uDepthMap, uv).r * uDepthScale;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        uniform sampler2D uColorMap; uniform sampler2D uDepthMap; uniform sampler2D uHeadAtlas;
        uniform float uDepthScale; uniform vec3 uLightPos; uniform float uLightIntensity;
        uniform float uActivePose; uniform float uPrevPose; uniform float uPoseBlend;
        uniform vec2 uDeltaPrev; uniform vec2 uHeadShift;
        varying vec2 vUv;
        vec4 headFrame(float i, vec2 h) {
          vec2 c = clamp(h, vec2(0.003), vec2(0.997));
          float col = mod(i, 6.0), row = floor(i / 6.0);
          return texture2D(uHeadAtlas, vec2((col + c.x) / 6.0, 1.0 - (row + c.y) / 6.0));
        }
        void main() {
          vec4 texColor = texture2D(uColorMap, vUv);
          float px = vUv.x * 1447.0, py = (1.0 - vUv.y) * 1087.0;
          if (px >= 465.0 && px <= 1005.0 && py <= 640.0) {
            float hx = (px - 465.0) / 540.0, hy = py / 640.0;
            vec2 dc = (vec2(hx, hy) - vec2(0.50, 0.43)) / 0.42;
            float dome = max(0.0, 1.0 - dot(dc, dc));
            float warpW = (0.35 + 0.65 * dome) * smoothstep(0.76, 0.50, hy);
            vec4 headCol = headFrame(uActivePose, vec2(hx, hy) - uHeadShift * warpW * vec2(0.032, 0.024));
            if (uPoseBlend < 0.995) {
              vec4 prevCol = headFrame(uPrevPose, vec2(hx, hy) - uDeltaPrev * warpW * vec2(0.032, 0.024));
              headCol = mix(prevCol, headCol, smoothstep(0.0, 1.0, uPoseBlend));
            }
            float a = headCol.a + texColor.a * (1.0 - headCol.a);
            texColor = vec4((headCol.rgb * headCol.a + texColor.rgb * texColor.a * (1.0 - headCol.a)) / max(a, 0.0001), a);
          }
          if (texColor.a < 0.08) discard;
          vec2 e = vec2(1.0 / 512.0, 1.0 / 384.0);
          float k = 1.1 + uDepthScale * 3.8;
          vec3 n = normalize(vec3(
            (texture2D(uDepthMap, vUv - vec2(e.x, 0.0)).r - texture2D(uDepthMap, vUv + vec2(e.x, 0.0)).r) * k,
            (texture2D(uDepthMap, vUv - vec2(0.0, e.y)).r - texture2D(uDepthMap, vUv + vec2(0.0, e.y)).r) * k, 1.0));
          vec3 L = normalize(vec3(uLightPos.xy - (vUv - 0.5) * 2.0, uLightPos.z));
          float diff = max(dot(n, L), 0.0);
          float spec = pow(max(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 32.0);
          float rim = pow(1.0 - max(n.z, 0.0), 2.4);
          vec3 rgb = texColor.rgb * (0.91 + 0.15 * diff * uLightIntensity)
                   + vec3(0.95, 0.98, 1.0) * spec * 0.11 * uLightIntensity
                   + vec3(0.22, 0.74, 0.97) * rim * 0.16 * uLightIntensity;
          gl_FragColor = vec4(rgb, texColor.a);
        }`,
      transparent: true, side: THREE.DoubleSide
    });
    shaderMaterials.push(mat);
    return mat;
  }

  function iconFaceMaterial(colorTex, depthTex, isBack) {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColorMap: { value: colorTex }, uDepthMap: { value: depthTex }, uDepthScale: { value: state.depthScale * 0.22 },
        uLightPos: { value: new THREE.Vector3(0.5, 0.5, 1.8) }, uLightIntensity: { value: state.lightIntensity },
        uMirrorX: { value: isBack ? 1 : 0 }, uHoverGlow: { value: 0 }
      },
      vertexShader: `
        uniform sampler2D uDepthMap; uniform float uDepthScale; uniform float uMirrorX;
        varying vec2 vSampleUv;
        void main() {
          vSampleUv = uMirrorX > 0.5 ? vec2(1.0 - uv.x, uv.y) : uv;
          vec3 p = position; p.z += texture2D(uDepthMap, vSampleUv).r * uDepthScale;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        uniform sampler2D uColorMap; uniform sampler2D uDepthMap; uniform float uDepthScale;
        uniform vec3 uLightPos; uniform float uLightIntensity; uniform float uHoverGlow;
        varying vec2 vSampleUv;
        void main() {
          vec4 texColor = texture2D(uColorMap, vSampleUv);
          if (texColor.a < 0.10) discard;
          vec2 e = vec2(1.0 / 128.0);
          float k = 1.4 + uDepthScale * 4.5;
          vec3 n = normalize(vec3(
            (texture2D(uDepthMap, vSampleUv - vec2(e.x, 0.0)).r - texture2D(uDepthMap, vSampleUv + vec2(e.x, 0.0)).r) * k,
            (texture2D(uDepthMap, vSampleUv - vec2(0.0, e.y)).r - texture2D(uDepthMap, vSampleUv + vec2(0.0, e.y)).r) * k, 1.0));
          vec3 L = normalize(vec3(uLightPos.xy - (vSampleUv - 0.5) * 1.5, uLightPos.z));
          float diff = max(dot(n, L), 0.0);
          float spec = pow(max(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 26.0);
          float rim = pow(1.0 - max(n.z, 0.0), 2.2);
          vec3 rgb = texColor.rgb * (0.88 + 0.22 * diff * uLightIntensity)
                   + vec3(0.95, 0.98, 1.0) * spec * 0.16 * uLightIntensity
                   + vec3(0.22, 0.74, 0.97) * rim * 0.22 * uLightIntensity
                   + vec3(0.18, 0.68, 1.0) * uHoverGlow * 0.35;
          gl_FragColor = vec4(rgb, texColor.a);
        }`,
      transparent: true, side: THREE.FrontSide
    });
    shaderMaterials.push(mat);
    return mat;
  }

  function iconRimMaterial(colorTex, c) {
    return new THREE.ShaderMaterial({
      uniforms: { uColorMap: { value: colorTex }, uRimColor: { value: new THREE.Vector3(c[0], c[1], c[2]) }, uHoverGlow: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform sampler2D uColorMap; uniform vec3 uRimColor; uniform float uHoverGlow; varying vec2 vUv;
        void main() {
          vec4 t = texture2D(uColorMap, vUv);
          if (t.a < 0.20) discard;
          gl_FragColor = vec4(mix(t.rgb * 0.68, uRimColor, 0.45) + vec3(0.15, 0.65, 1.0) * uHoverGlow * 0.30, t.a);
        }`,
      transparent: true, side: THREE.DoubleSide
    });
  }

  const linearTex = (t) => { t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; return t; };

  /* ---------- Dựng mô hình từ 2 ảnh ---------- */
  function build(baseImg, headAtlasImg) {
    const W = baseImg.naturalWidth || IMG_W, H = baseImg.naturalHeight || IMG_H;
    const aspect = W / H;
    const planeWidth = planeHeight * aspect;

    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = W; fullCanvas.height = H;
    const fullCtx = fullCanvas.getContext('2d');
    fullCtx.drawImage(baseImg, 0, 0, W, H);
    const fullData = fullCtx.getImageData(0, 0, W, H); // ném lỗi nếu ảnh bị "tainted" (mở bằng file://)

    // Thân chính = ảnh nền đã khoét bỏ 8 icon
    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = W; mainCanvas.height = H;
    const mainCtx = mainCanvas.getContext('2d');
    const mainImgData = mainCtx.createImageData(W, H);
    mainImgData.data.set(fullData.data);
    FLOATING_LAYERS.forEach(({ bbox: [x0, y0, x1, y1], excludeRect: ex }) => {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (ex && x >= ex[0] && y >= ex[1] && x <= ex[2] && y <= ex[3]) continue;
        mainImgData.data[(y * W + x) * 4 + 3] = 0;
      }
    });
    mainCtx.putImageData(mainImgData, 0, 0);

    const depthW = 360;
    const mainColorTex = linearTex(new THREE.CanvasTexture(mainCanvas));
    const mainDepthTex = linearTex(new THREE.CanvasTexture(mainDepthMap(mainCanvas, depthW, Math.round(depthW / aspect))));
    const headAtlasTex = linearTex(new THREE.Texture(headAtlasImg));
    headAtlasTex.needsUpdate = true;

    reliefGroup.add(new THREE.Mesh(new THREE.PlaneGeometry(planeWidth, planeHeight, 96, 72),
      mainMaterial(mainColorTex, mainDepthTex, headAtlasTex)));

    // Bóng đổ mềm phía sau
    shadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(planeWidth * 1.04, planeHeight * 1.04),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas(fullCanvas, 256, Math.round(256 / aspect))), transparent: true, opacity: 0.22, depthWrite: false })
    );
    shadowMesh.position.set(0, -0.04, -0.28);
    reliefGroup.add(shadowMesh);

    // 8 icon 3D đặc, hai mặt
    FLOATING_LAYERS.forEach((layer) => {
      const [x0, y0, x1, y1] = layer.bbox, ex = layer.excludeRect;
      const pad = 12, cw = x1 - x0 + 1 + pad * 2, ch = y1 - y0 + 1 + pad * 2;
      const iconCanvas = document.createElement('canvas');
      iconCanvas.width = cw; iconCanvas.height = ch;
      const iconCtx = iconCanvas.getContext('2d');
      const d = iconCtx.createImageData(cw, ch);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (ex && x >= ex[0] && y >= ex[1] && x <= ex[2] && y <= ex[3]) continue;
        const s = (y * W + x) * 4, t = ((y - y0 + pad) * cw + (x - x0 + pad)) * 4;
        d.data[t] = fullData.data[s]; d.data[t + 1] = fullData.data[s + 1];
        d.data[t + 2] = fullData.data[s + 2]; d.data[t + 3] = fullData.data[s + 3];
      }
      iconCtx.putImageData(d, 0, 0);

      const colorTex = linearTex(new THREE.CanvasTexture(iconCanvas));
      const depthTex = linearTex(new THREE.CanvasTexture(iconDepthMap(iconCanvas, 96, 96)));
      const worldX = (((x0 + x1) * 0.5) / W - 0.5) * planeWidth;
      const worldY = (0.5 - ((y0 + y1) * 0.5) / H) * planeHeight;
      const worldW = (cw / W) * planeWidth, worldH = (ch / H) * planeHeight;

      const group = new THREE.Group();
      const halfThick = 0.020;
      const faceGeo = new THREE.PlaneGeometry(worldW, worldH, 26, 26);
      const frontMat = iconFaceMaterial(colorTex, depthTex, false);
      const frontMesh = new THREE.Mesh(faceGeo, frontMat);
      frontMesh.position.z = halfThick;
      const backMat = iconFaceMaterial(colorTex, depthTex, true);
      const backMesh = new THREE.Mesh(faceGeo, backMat);
      backMesh.rotation.y = Math.PI;
      backMesh.position.z = -halfThick;
      group.add(frontMesh, backMesh);
      const rimGeo = new THREE.PlaneGeometry(worldW, worldH, 2, 2);
      const rimMat = iconRimMaterial(colorTex, layer.rimColor);
      for (let s = 0; s < 4; s++) {
        const m = new THREE.Mesh(rimGeo, rimMat);
        m.position.z = -halfThick + (2 * halfThick * (s + 0.5)) / 4;
        group.add(m);
      }

      group.userData = {
        cfg: layer, baseWorldX: worldX, baseWorldY: worldY, frontMat, backMat, rimMat,
        springX: 0, springY: 0, velX: 0, velY: 0, hoverZ: 0, velHoverZ: 0, hoverGlow: 0,
        bounceOffset: 0, bounceVel: 0, targetFlipY: 0, currentFlipY: 0, velFlipY: 0
      };
      frontMesh.userData.parentGroup = group;
      backMesh.userData.parentGroup = group;
      raycastTargets.push(frontMesh, backMesh);
      reliefGroup.add(group);
      floatingIconGroups.push(group);
    });

    // Hạt sáng li ti phía sau
    const count = 60, pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 5.2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3.4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.2 - 0.3;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    bgParticlesGroup.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.03, transparent: true, opacity: 0.35 })));
  }

  function mainDepthMap(src, dw, dh) {
    const tmp = document.createElement('canvas');
    tmp.width = dw; tmp.height = dh;
    const ctx = tmp.getContext('2d');
    ctx.drawImage(src, 0, 0, dw, dh);
    const data = ctx.getImageData(0, 0, dw, dh).data;
    const buf = new Float32Array(dw * dh);
    for (let y = 0; y < dh; y++) {
      const ny = y / dh;
      for (let x = 0; x < dw; x++) {
        const nx = x / dw, i = (y * dw + x) * 4;
        const a = data[i + 3] / 255;
        const hdx = (nx - 0.50) / 0.19, hdy = (ny - 0.28) / 0.28, hd = hdx * hdx + hdy * hdy;
        if (a < 0.05 && hd >= 1) continue;
        const luma = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
        let h = 0.40;
        if (ny > 0.41 && ny < 0.72 && nx > 0.26 && nx < 0.74 && luma < 0.32 && Math.abs(nx - 0.5) > 0.13) h = 0.16;
        if (hd < 1) h = Math.max(h, 0.45 + Math.sqrt(1 - hd) * 0.26);
        if (ny > 0.48 && ny < 0.92) h = Math.max(h, 0.36 + Math.max(0, 1 - Math.pow((nx - 0.50) / 0.34, 2)) * 0.22);
        if (nx > 0.304 && nx < 0.695 && ny > 0.578 && ny < 0.925 && luma > 0.42) h = Math.max(h, 0.76 + (0.93 - ny) * 0.16);
        if (nx < 0.31 && ny > 0.56 && a > 0.1) h = Math.max(h, 0.80 + (1 - Math.abs(nx - 0.18) / 0.14) * 0.12);
        if (nx > 0.745 && ny > 0.72 && a > 0.1) h = Math.max(h, 0.82 + Math.max(0, 1 - Math.pow((nx - 0.835) / 0.085, 2)) * 0.14);
        buf[y * dw + x] = Math.min(1, h);
      }
    }
    return grayCanvas(tmp, ctx, blur(buf, dw, dh, 5), dw, dh);
  }

  function iconDepthMap(src, dw, dh) {
    const tmp = document.createElement('canvas');
    tmp.width = dw; tmp.height = dh;
    const ctx = tmp.getContext('2d');
    ctx.drawImage(src, 0, 0, dw, dh);
    const data = ctx.getImageData(0, 0, dw, dh).data;
    const buf = new Float32Array(dw * dh);
    for (let y = 0; y < dh; y++) {
      const dy = (y / dh - 0.5) * 2;
      for (let x = 0; x < dw; x++) {
        const dx = (x / dw - 0.5) * 2, i = (y * dw + x) * 4, a = data[i + 3] / 255;
        if (a <= 0.12) continue;
        const luma = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11) / 255;
        const dome = Math.max(0, 1 - (dx * dx + dy * dy) * 0.45);
        buf[y * dw + x] = Math.min(1, (0.50 + dome * 0.30 + luma * 0.22) * a);
      }
    }
    return grayCanvas(tmp, ctx, blur(buf, dw, dh, 4), dw, dh);
  }

  function grayCanvas(tmp, ctx, buf, w, h) {
    const out = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const v = Math.max(0, Math.min(255, Math.round(buf[i] * 255)));
      out.data[i * 4] = out.data[i * 4 + 1] = out.data[i * 4 + 2] = v;
      out.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
    return tmp;
  }

  function blur(src, w, h, r) {
    let curr = new Float32Array(src);
    const next = new Float32Array(w * h);
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let s = 0;
        for (let k = -r; k <= r; k++) s += curr[y * w + Math.min(w - 1, Math.max(0, x + k))];
        next[y * w + x] = s / (2 * r + 1);
      }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let s = 0;
        for (let k = -r; k <= r; k++) s += next[Math.min(h - 1, Math.max(0, y + k)) * w + x];
        curr[y * w + x] = s / (2 * r + 1);
      }
    }
    return curr;
  }

  function shadowCanvas(src, sw, sh) {
    const c = document.createElement('canvas');
    c.width = sw; c.height = sh;
    const ctx = c.getContext('2d');
    ctx.filter = 'blur(14px)';
    ctx.drawImage(src, 12, 12, sw - 24, sh - 24);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, sw, sh);
    return c;
  }

  /* ---------- Chọn tư thế đầu theo chuột (lướt tuần tự qua các khung) ---------- */
  function updateHead(nx, ny, dt) {
    const tx = Math.max(-1.02, Math.min(1.02, nx));
    const ty = Math.max(-1.02, Math.min(1.02, (ny - FRONT_Y) * 1.08));
    const dx = tx - state.scrubX, dy = ty - state.scrubY, dist = Math.hypot(dx, dy);
    const maxStep = Math.max(0.18, dist * 0.38) * (dt * 60);
    if (dist > maxStep && dist > 1e-4) { state.scrubX += dx / dist * maxStep; state.scrubY += dy / dist * maxStep; }
    else { state.scrubX = tx; state.scrubY = ty; }

    state.poseBlend = Math.min(1, state.poseBlend + dt / 0.088);
    let best = state.activePoseIdx, bestD = 1e9;
    for (const p of HEAD_FRAMES_36) {
      let d = Math.hypot(state.scrubX - p.gx, state.scrubY - p.gy);
      if (p.idx === state.activePoseIdx) d -= 0.014;
      if (d < bestD) { bestD = d; best = p.idx; }
    }
    if (best !== state.activePoseIdx && state.poseBlend >= 0.35) {
      state.prevPoseIdx = state.activePoseIdx;
      state.activePoseIdx = best;
      state.poseBlend = 0;
    }
    const clamp = (v) => Math.max(-0.35, Math.min(0.35, v));
    const a = HEAD_FRAMES_36[state.activePoseIdx], b = HEAD_FRAMES_36[state.prevPoseIdx];
    return {
      shiftX: clamp(state.scrubX - a.gx), shiftY: clamp(state.scrubY - a.gy),
      prevShiftX: clamp(state.scrubX - b.gx), prevShiftY: clamp(state.scrubY - b.gy)
    };
  }

  /* ---------- Kích thước & khung hình camera ---------- */
  function resize() {
    const w = canvas.clientWidth || mount.clientWidth * (1 + 2 * PAD);
    const h = canvas.clientHeight || mount.clientHeight * (1 + 2 * PAD);
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Ảnh nền chiếm đúng phần .avatar-3d, phần đệm PAD dành cho icon bay ra ngoài
    const visibleH = planeHeight * (1 + 2 * PAD);
    state.cameraZoom = visibleH / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    camera.position.z = state.cameraZoom;
    rectCache = null;
    if (ready && !running) renderOnce();
  }

  /* ---------- Tương tác ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hoveredGroup = null;
  let rectCache = null;
  const rect = () => rectCache || (rectCache = canvas.getBoundingClientRect());
  addEventListener('scroll', () => { rectCache = null; }, { passive: true });

  let paused = false, heroVisible = true, idleTimer = 0, greetTimers = [];
  const motionOn = () => !paused && !reduced.matches;

  function lookAt(x, y) { state.mouseX = x; state.mouseY = y; wake(); }
  function lookFront() {
    state.targetRotX = 0; state.targetRotY = 0;
    lookAt(0, FRONT_Y);
  }
  const stopGreeting = () => { greetTimers.forEach(clearTimeout); greetTimers = []; };

  function follow(clientX, clientY) {
    if (!ready || !motionOn() || !heroVisible || introOpen()) return;
    stopGreeting();
    const r = rect();
    // Tâm = đầu nhân vật (khoảng 28% chiều cao ảnh, tính trong canvas có đệm)
    const headX = r.left + r.width * 0.5;
    const headY = r.top + r.height * ((PAD + 0.28) / (1 + 2 * PAD));
    const nx = Math.max(-1, Math.min(1, (clientX - headX) / (innerWidth * 0.5)));
    const ny = Math.max(-1, Math.min(1, (clientY - headY) / (innerHeight * 0.5))) + FRONT_Y;
    const tilt = 0.22 * state.mouseSensitivity;
    state.targetRotY = nx * tilt;
    state.targetRotX = (ny - FRONT_Y) * tilt * 0.72;

    // Rê chuột lên icon → icon nổi lên & phát sáng
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    const hits = raycastTargets.length ? raycaster.intersectObjects(raycastTargets, false) : [];
    hoveredGroup = hits.length ? hits[0].object.userData.parentGroup : null;
    canvas.classList.toggle('is-hover', !!hoveredGroup);

    clearTimeout(idleTimer);
    idleTimer = setTimeout(idle, 3500);
    lookAt(nx, ny);
  }

  function idle() {
    clearTimeout(idleTimer);
    hoveredGroup = null;
    canvas.classList.remove('is-hover');
    lookFront();
  }

  function flip(group) {
    if (!group) return;
    group.userData.bounceVel = 2.6;
    group.userData.targetFlipY += Math.PI * 2;
    wake();
  }

  let touchId = null;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'touch' || e.pointerId === touchId) follow(e.clientX, e.clientY);
  }, { passive: true });
  document.addEventListener('mouseleave', () => { if (ready && motionOn()) idle(); });
  addEventListener('blur', () => { if (ready && motionOn()) idle(); });
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') touchId = e.pointerId;
    follow(e.clientX, e.clientY);
    if (motionOn()) flip(hoveredGroup);
  }, { passive: true });
  const endTouch = (e) => { if (e.pointerId !== touchId) return; touchId = null; if (motionOn()) idle(); };
  addEventListener('pointerup', endTouch);
  addEventListener('pointercancel', endTouch);

  // Lời chào sau video intro: liếc trái → liếc phải → nhìn thẳng
  addEventListener('portfolio:intro-done', () => {
    if (!ready || !motionOn()) return;
    stopGreeting();
    clearTimeout(idleTimer);
    stage.classList.remove('is-hint'); void stage.offsetWidth; stage.classList.add('is-hint');
    greetTimers.push(setTimeout(() => stage.classList.remove('is-hint'), 3400));
    [[-0.7, 650], [0.7, 1500], [0, 2500]].forEach(([x, at]) => greetTimers.push(setTimeout(() => lookAt(x, FRONT_Y), at)));
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      heroVisible = e.isIntersecting;
      if (heroVisible) wake(); else if (ready) idle();
    }).observe(stage);
  }

  function refresh() {
    const stopped = !motionOn();
    if (button) {
      button.disabled = reduced.matches;
      button.setAttribute('aria-pressed', String(stopped));
      button.setAttribute('aria-label', stopped ? 'Bật chuyển động nhân vật' : 'Tạm dừng chuyển động nhân vật');
      button.textContent = stopped ? '▶' : 'Ⅱ';
    }
    if (caption) caption.textContent = stopped ? 'Chuyển động đã tạm dừng'
      : (finePointer ? 'Di chuyển chuột — Hùng sẽ nhìn theo bạn' : 'Chạm vào Hùng để nhìn theo');
    stopGreeting();
    if (reduced.matches) {
      // Không chuyển động: đặt thẳng về tư thế chính diện và vẽ một khung tĩnh
      Object.assign(state, {
        mouseX: 0, mouseY: FRONT_Y, smoothMouseX: 0, smoothMouseY: FRONT_Y, velMouseX: 0, velMouseY: 0,
        targetRotX: 0, targetRotY: 0, currentRotX: 0, currentRotY: 0, velRotX: 0, velRotY: 0,
        scrubX: 0, scrubY: 0, activePoseIdx: 0, prevPoseIdx: 0, poseBlend: 1
      });
      renderOnce();
    } else idle();
  }
  if (button) button.addEventListener('click', () => { paused = !paused; refresh(); });
  reduced.addEventListener ? reduced.addEventListener('change', refresh) : reduced.addListener(refresh);

  /* ---------- Vòng lặp ---------- */
  const clock = new THREE.Clock(false);
  let ready = false, running = false, settleUntil = 0;

  // Chạy vòng lặp khi cần; khi tạm dừng vẫn chạy thêm ~1s để nhân vật về tư thế chính diện rồi dừng hẳn.
  function wake() {
    if (!ready || reduced.matches) return;
    settleUntil = performance.now() + 1200;
    if (!running) { running = true; clock.start(); requestAnimationFrame(frame); }
  }

  function frame() {
    const keepGoing = heroVisible && (motionOn() || performance.now() < settleUntil);
    if (!keepGoing) { running = false; clock.stop(); return; }
    requestAnimationFrame(frame);
    step(Math.min(0.033, Math.max(0.001, clock.getDelta())), clock.elapsedTime);
  }

  let floatT = 0;
  function step(dt, t) {
    const float = motionOn() ? state.floatSpeed : 0;
    floatT += dt * float;

    state.velMouseX += (state.mouseX - state.smoothMouseX) * 95 * dt;
    state.velMouseY += (state.mouseY - state.smoothMouseY) * 95 * dt;
    const cd = Math.exp(-18 * dt);
    state.velMouseX *= cd; state.velMouseY *= cd;
    state.smoothMouseX += state.velMouseX * dt;
    state.smoothMouseY += state.velMouseY * dt;

    state.velRotX += (state.targetRotX - state.currentRotX) * 70 * dt;
    state.velRotY += (state.targetRotY - state.currentRotY) * 70 * dt;
    const rd = Math.exp(-15 * dt);
    state.velRotX *= rd; state.velRotY *= rd;
    state.currentRotX += state.velRotX * dt;
    state.currentRotY += state.velRotY * dt;
    rigGroup.rotation.x = state.currentRotX;
    rigGroup.rotation.y = state.currentRotY;

    const g = updateHead(state.smoothMouseX, state.smoothMouseY, dt);
    const lx = state.smoothMouseX * 1.35, ly = -state.smoothMouseY * 1.35;
    shaderMaterials.forEach((m) => {
      m.uniforms.uLightPos.value.set(lx, ly, 1.55);
      if (m.uniforms.uActivePose) {
        m.uniforms.uActivePose.value = state.activePoseIdx;
        m.uniforms.uPrevPose.value = state.prevPoseIdx;
        m.uniforms.uPoseBlend.value = state.poseBlend;
        m.uniforms.uHeadShift.value.set(g.shiftX, g.shiftY);
        m.uniforms.uDeltaPrev.value.set(g.prevShiftX, g.prevShiftY);
      }
    });

    floatingIconGroups.forEach((grp) => {
      const ud = grp.userData, cfg = ud.cfg, phase = cfg.floatPhase, ft = floatT;
      const tpx = state.mouseX * 0.058 * (cfg.parallaxFactor - 1) * state.parallaxScale;
      const tpy = -(state.mouseY - FRONT_Y) * 0.058 * (cfg.parallaxFactor - 1) * state.parallaxScale;
      ud.velX += (tpx - ud.springX) * cfg.springStiff * dt;
      ud.velY += (tpy - ud.springY) * cfg.springStiff * dt;
      const ld = Math.exp(-cfg.springDamp * dt);
      ud.velX *= ld; ud.velY *= ld;
      ud.springX += ud.velX * dt; ud.springY += ud.velY * dt;

      const hovered = hoveredGroup === grp;
      ud.velHoverZ += ((hovered ? 0.11 : 0) - ud.hoverZ) * 120 * dt;
      ud.velHoverZ *= Math.exp(-16 * dt);
      ud.hoverZ += ud.velHoverZ * dt;
      ud.hoverGlow += ((hovered ? 1 : 0) - ud.hoverGlow) * (1 - Math.exp(-14 * dt));
      ud.frontMat.uniforms.uHoverGlow.value = ud.backMat.uniforms.uHoverGlow.value = ud.rimMat.uniforms.uHoverGlow.value = ud.hoverGlow;

      ud.bounceVel -= ud.bounceOffset * 140 * dt;
      ud.bounceVel *= Math.exp(-10 * dt);
      ud.bounceOffset += ud.bounceVel * dt;
      ud.velFlipY += (ud.targetFlipY - ud.currentFlipY) * 65 * dt;
      ud.velFlipY *= Math.exp(-9.5 * dt);
      ud.currentFlipY += ud.velFlipY * dt;

      const bobY = (Math.sin(ft * 1.85 + phase) * 0.75 + Math.cos(ft * 0.95 + phase * 1.7) * 0.25) * cfg.floatAmp;
      const bobX = (Math.cos(ft * 1.35 + phase) * 0.75 + Math.sin(ft * 0.80 + phase * 1.3) * 0.25) * cfg.floatAmp * 0.48;
      const baseZ = cfg.baseZ * state.parallaxScale;
      const persp = (state.cameraZoom - baseZ) / state.cameraZoom;
      grp.position.set(ud.baseWorldX * persp + bobX + ud.springX, ud.baseWorldY * persp + bobY + ud.springY, baseZ + ud.hoverZ + ud.bounceOffset);
      grp.scale.setScalar(persp * (1 + ud.hoverZ * 0.45 + ud.bounceOffset * 0.30));
      grp.rotation.z = Math.sin(ft * 1.45 + phase) * cfg.rotAmp - ud.springX * 0.45;
      grp.rotation.y = ud.currentFlipY + ud.springX * 2.4;
      grp.rotation.x = -ud.springY * 2.2;
    });

    if (shadowMesh) {
      shadowMesh.position.x = -state.currentRotY * 0.22;
      shadowMesh.position.y = -0.04 + state.currentRotX * 0.18;
    }
    bgParticlesGroup.rotation.y = floatT * 0.035 + state.currentRotY * 0.35;
    bgParticlesGroup.rotation.x = state.currentRotX * 0.25;

    renderer.render(scene, camera);
  }

  function renderOnce() { step(0.016, clock.elapsedTime); }

  /* ---------- Chữ PORTFOLIO trôi nhẹ ngược hướng chuột (chiều sâu) ---------- */
  if (hero && finePointer) {
    let mx = 0, my = 0, cx = 0, cy = 0, pRaf = 0, heroRect = null;
    const wordmark = hero.querySelector('.hero-wordmark');
    const aurora = hero.querySelector('.hero-aurora');
    const loop = () => {
      cx += (mx - cx) * 0.08; cy += (my - cy) * 0.08;
      if (wordmark) {
        wordmark.style.setProperty('--wm-x', (cx * -18).toFixed(2) + 'px');
        wordmark.style.setProperty('--wm-y', (cy * -10).toFixed(2) + 'px');
      }
      if (aurora) aurora.style.setProperty('--au-x', (cx * 30).toFixed(2) + 'px');
      pRaf = Math.abs(mx - cx) + Math.abs(my - cy) > 0.001 ? requestAnimationFrame(loop) : 0;
    };
    addEventListener('scroll', () => { heroRect = null; }, { passive: true });
    addEventListener('resize', () => { heroRect = null; });
    hero.addEventListener('pointermove', (e) => {
      if (reduced.matches) return;
      const r = heroRect || (heroRect = hero.getBoundingClientRect());
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
      if (!pRaf) pRaf = requestAnimationFrame(loop);
    }, { passive: true });
  }

  /* ---------- Khởi động ---------- */
  const BASE = 'assets/avatar3d/base_scene.webp', ATLAS = 'assets/avatar3d/head_atlas_3x3.webp';
  const loadImg = (src) => new Promise((res, rej) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
  // Mở trực tiếp bằng file:// → trình duyệt chặn đọc điểm ảnh → dùng bản ảnh nhúng sẵn (data URI)
  const loadInline = () => new Promise((res, rej) => {
    if (window.__AVATAR3D_IMAGES) return res(window.__AVATAR3D_IMAGES);
    const s = document.createElement('script');
    s.src = 'assets/avatar3d/images-inline.js';
    s.onload = () => (window.__AVATAR3D_IMAGES ? res(window.__AVATAR3D_IMAGES) : rej());
    s.onerror = rej;
    document.head.appendChild(s);
  });

  function start(base, atlas) {
    build(base, atlas);
    ready = true;
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(mount);
    else addEventListener('resize', resize);
    resize();
    renderOnce();
    stage.classList.add('avatar-ready');
    refresh();
  }

  const loadPair = (b, a) => Promise.all([loadImg(b), loadImg(a)]);
  loadPair(BASE, ATLAS)
    .then(([b, a]) => start(b, a))
    .catch(() => loadInline().then((d) => loadPair(d.base, d.atlas)).then(([b, a]) => start(b, a)))
    .catch((err) => {  // vẫn lỗi → giữ ảnh tĩnh
      console.warn('[avatar3d] Không khởi tạo được nhân vật 3D:', err);
      stage.classList.remove('avatar-ready');
      canvas.remove();
    });
})();
