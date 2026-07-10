import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
import { UP, FORWARD } from './utils.js';

export function makeTexture(kind) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (kind === 'asphalt') {
    ctx.fillStyle = '#23262c';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1100; i += 1) {
      const value = 40 + Math.floor(Math.random() * 28);
      ctx.fillStyle = `rgba(${value},${value},${value},${0.15 + Math.random() * 0.25})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let y = 0; y < 256; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y + 8);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 32) {
      ctx.fillStyle = (x / 32) % 2 === 0 ? '#d31b38' : '#f6f6f6';
      ctx.fillRech(x, 0, 32, 256);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 40);
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
    uvs.push(0, t * 80, 1, t * 80);
    if (i < segments) {
      const base = i * 2;
      indices.push(base, base + 2, base + 1, base + 2, base + 3, base + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function add(group, geometry, material, x, y, z, cast = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

export function createF1Car(team, scale = 1) {
  const car = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: team.primary, metalness: 0.45, roughness: 0.27 });
  const secondary = new THREE.MeshStandardMaterial({ color: team.secondary, metalness: 0.3, roughness: 0.32 });
  const carbon = new THREE.MeshStandardMaterial({ color: 0x040507, metalness: 0.5, roughness: 0.3 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x010101, roughness: 0.85 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x071625, metalness: 0.1, roughness: 0.12 });
  
  const floor = add(car, new THREE.BoxGeometry(1.5, 0.18, 4.9), carbon, 0, 0.32, 0);
  floor.position.z = -0.05;
  add(car, new THREE.BoxGeometry(1.28, 0.38, 2.75), body, 0, 0.55, -0.1);
  add(car, new THREE.BoxGeometry(0.52, 0.31, 2.8), body, 0, 0.47, -2.55);
  add(car, new THREE.ConeGeometry(0.24, 1.15, 12), body, 0, 0.47, -4.3).rotation.x = -Math.PI / 2;
  
  const cockpit = add(car, new THREE.SphereGeometry(0.53, 16, 12), glass, 0, 0.92, -0.15);
  cockpit.scale.set(1, 0.62, 1.4);
  const halo = add(car, new THREE.TorusGeometry(0.55, 0.07, 8, 24, Math.PI), carbon, 0, 1.22, -0.2);
  halo.rotation.x = -Math.PI / 2;
  halo.rotation.z = Math.PI;
  
  add(car, new THREE.BoxGeometry(3.1, 0.12, 0.6), carbon, 0, 0.35, -3.8);
  add(car, new THREE.BoxGeometry(1.35, 0.12, 0.55), secondary, 0, 0.38, -3.55);
  add(car, new THREE.BoxGeometry(2.48, 0.16, 0.6), carbon, 0, 0.98, 2.05);
  add(car, new THREE.BoxGeometry(2.22, 0.55, 0.12), secondary, 0, 1.24, 2.22);
  for (const x of [-1.02, 1.02]) {
    add(car, new THREE.BoxGeometry(0.82, 0.13, 1.65), body, x, 0.48, -1.35).rotation.z = x < 0 ? -0.08 : 0.08;
    add(car, new THREE.BoxGeometry(0.75, 0.12, 1.28), body, x * 0.92, 0.47, 0.85).rotation.z = x < 0 ? 0.06 : -0.06;
  }
  
  const wheelsGeometry = new THREE.CylinderGeometry(0.54, 0.54, 0.38, 24);
  const wheels = [];
  for (const [x, z] of [[-1.12, -2.25], [1.12, -2.25], [-1.12, 1.3], [1.12, 1.3]]) {
    const wheel = add(car, wheelsGeometry, rubber, x, 0.48, z);
    wheel.rotation.z = Math.PI / 2;
    wheels.push(wheel);
  }
  
  const flameMaterial = new THREE.MeshBasicMaterial({ color: 0x42beff, transparent: true, opacity: 0.9 });
  const flames = [];
  for (const x of [-0.24, 0.24]) {
    const flame = add(car, new THREE.ConeGeometry(0.14, 0.9, 10), flameMaterial, x, 0.47, 2.95, false);
    flame.rotation.x = Math.PI / 2;
    flame.visible = false;
    flames.push(flame);
  }

  const rearLight = add(car, new THREE.BoxGeometry(0.36, 0.13, 0.15), new THREE.MeshBasicMaterial({ color: 0xff0018 }), 0, 0.62, 2.38, false);
  rearLight.visible = false;
  
  car.userData = { wheels, flames, rearLight };
  car.scale.setScalar(scale);
  return car;
}
