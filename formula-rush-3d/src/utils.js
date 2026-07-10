import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const mod = (n, m) => ((n % m) + m) % m;
export const rand = (min, max) => min + Math.random() * (max - min);
export const UP = new THREE.Vector3(0, 1, 0);
export const FORWARD = new THREE.Vector3(0, 0, -1);

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}
