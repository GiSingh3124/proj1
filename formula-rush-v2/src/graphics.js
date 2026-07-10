import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const mod = (n, m) => ((n % m) + m) % m;
export const rand = (min, max) => min + Math.random() * (max - min);
export const circularDistance = (a, b) => mod(a - b + 0.5, 1) - 0.5;
export const UP = new THREE.Vector3(0, 1, 0);
export const FORWARD = new THREE.Vector3(0, 0, -1);

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

export function makeTexture(kind) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (kind === 'asphalt') {
    ctx.fillStyle = '#30343a'; ctx.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 5000; i += 1) {
      const v = 34 + Math.floor(Math.random() * 35);
      ctx.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.12})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 512, 1, 1);
    }
    ctx.fillStyle = 'rgba(20,20,22,.25)';
    ctx.fillRect(78, 0, 8, 512); ctx.fillRect(170, 0, 8, 512);
  } else {
    for (let y = 0; y < 512; y += 64) {
      ctx.fillStyle = (y / 64) % 2 === 0 ? '#f2f2f2' : '#d71f35';
      ctx.fillRect(0, y, 256, 64);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function buildRibbon(curve, centerOffset, width, segments = 900) {
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3().crossVectors(UP, tangent).normalize();
    const center = point.clone().addScaledVector(normal, centerOffset);
    const left = center.clone().addScaledVector(normal, -width / 2);
    const right = center.clone().addScaledVector(normal, width / 2);
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    uvs.push(0, t * 90, 1, t * 90);
    if (i < segments) {
      const p = i * 2;
      indices.push(p, p + 2, p + 1, p + 2, p + 3, p + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createF1Car(team, scale = 1) {
  const car = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({
    color: team.primary, metalness: 0.55, roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.18,
  });
  const accent = new THREE.MeshPhysicalMaterial({
    color: team.secondary, metalness: 0.42, roughness: 0.25, clearcoat: 0.7,
  });
  const carbon = new THREE.MeshStandardMaterial({ color: 0x090b0f, metalness: 0.35, roughness: 0.55 });
  const tyre = new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.88 });
  const rim = new THREE.MeshStandardMaterial({ color: 0x30343a, metalness: 0.8, roughness: 0.22 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x071421, metalness: 0.1, roughness: 0.08, transmission: 0.15 });

  const add = (geometry, material, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    car.add(mesh);
    return mesh;
  };

  // Floor and main body
  add(new THREE.BoxGeometry(1, 1, 1), carbon, 0, 0.34, 0.15, 2.15, 0.12, 4.75);
  add(new THREE.CapsuleGeometry(0.55, 2.8, 8, 20), paint, 0, 0.72, -0.35, 1.0, 0.72, 1.55).rotation.x = Math.PI / 2;
  add(new THREE.ConeGeometry(0.44, 3.2, 16), paint, 0, 0.56, -3.0, 1, 1, 1).rotation.x = -Math.PI / 2;
  add(new THREE.BoxGeometry(1, 1, 1), paint, -0.82, 0.55, 0.1, 0.78, 0.5, 2.05);
  add(new THREE.BoxGeometry(1, 1, 1), paint, 0.82, 0.55, 0.1, 0.78, 0.5, 2.05);
  add(new THREE.BoxGeometry(1, 1, 1), accent, 0, 0.72, 0.6, 0.9, 0.13, 1.9);
  add(new THREE.SphereGeometry(0.56, 20, 12), glass, 0, 1.05, 0.15, 1, 0.58, 1.2);

  // Wings
  add(new THREE.BoxGeometry(3.25, 0.1, 0.42), accent, 0, 0.25, -4.15);
  add(new THREE.BoxGeometry(2.75, 0.11, 0.3), carbon, 0, 0.38, -3.78);
  add(new THREE.BoxGeometry(2.55, 0.12, 0.46), accent, 0, 1.05, 2.15);
  add(new THREE.BoxGeometry(2.3, 0.08, 0.4), carbon, 0, 0.78, 2.05);
  add(new THREE.BoxGeometry(0.12, 0.75, 0.38), carbon, -1.04, 0.78, 2.0);
  add(new THREE.BoxGeometry(0.12, 0.75, 0.38), carbon, 1.04, 0.78, 2.0);

  // Halo
  const halo = add(new THREE.TorusGeometry(0.58, 0.07, 8, 28, Math.PI * 1.4), carbon, 0, 1.43, 0.05);
  halo.rotation.x = Math.PI / 2;
  halo.rotation.z = Math.PI * 0.3;
  add(new THREE.CylinderGeometry(0.055, 0.055, 0.78, 8), carbon, 0, 1.22, -0.48).rotation.x = Math.PI / 2;

  // Wheels, rims and suspension
  const wheelPositions = [[-1.38, -2.55], [1.38, -2.55], [-1.42, 1.32], [1.42, 1.32]];
  const wheels = [];
  wheelPositions.forEach(([x, z]) => {
    const wheel = add(new THREE.CylinderGeometry(0.57, 0.57, 0.42, 24), tyre, x, 0.52, z);
    wheel.rotation.z = Math.PI / 2;
    const wheelRim = add(new THREE.CylinderGeometry(0.28, 0.28, 0.435, 18), rim, x, 0.52, z);
    wheelRim.rotation.z = Math.PI / 2;
    wheels.push(wheel);
    const side = Math.sign(x);
    const susp = add(new THREE.CylinderGeometry(0.025, 0.025, 1.05, 6), carbon, side * 0.75, 0.55, z);
    susp.rotation.z = Math.PI / 2.8 * side;
  });

  // Rear light and ERS glow
  const light = add(new THREE.BoxGeometry(0.28, 0.12, 0.08), new THREE.MeshBasicMaterial({ color: 0xff192f }), 0, 0.57, 2.46);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x53c7ff, transparent: true, opacity: 0.86 });
  const flames = [];
  [-0.38, 0.38].forEach((x) => {
    const flame = add(new THREE.ConeGeometry(0.13, 0.9, 10), glowMat, x, 0.45, 2.72);
    flame.rotation.x = Math.PI / 2;
    flame.visible = false;
    flames.push(flame);
  });

  car.userData = { wheels, flames, rearLight: light };
  car.scale.setScalar(scale);
  return car;
}

