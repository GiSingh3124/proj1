import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
import { FORWARD, UP, mod } from './graphics.js';

export const sceneMethods = {
setupLighting() {
    this.scene.add(new THREE.HemisphereLight(0xcfe4ff, 0x3a4b28, 1.65));
    const sun = new THREE.DirectionalLight(0xffffff, 2.7);
    sun.position.set(-75, 120, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1536, 1536);
    sun.shadow.camera.left = -120; sun.shadow.camera.right = 120;
    sun.shadow.camera.top = 120; sun.shadow.camera.bottom = -120;
    this.scene.add(sun);
  },

resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  },

clearGroup(group) {
    while (group.children.length) {
      const child = group.children.pop();
      child.traverse?.((node) => {
        node.geometry?.dispose?.();
        if (Array.isArray(node.material)) node.material.forEach((m) => m.dispose?.());
        else node.material?.dispose?.();
      });
    }
  },

createBarriers() {
    const geometry = new THREE.BoxGeometry(0.34, 1.1, 1.85);
    const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xe7ebf1, roughness: 0.68 });
    const redMaterial = new THREE.MeshStandardMaterial({ color: 0xd81e35, roughness: 0.68 });
    const countPerSide = 150;
    const redCount = countPerSide;
    const whiteCount = countPerSide;
    const red = new THREE.InstancedMesh(geometry, redMaterial, redCount);
    const white = new THREE.InstancedMesh(geometry, whiteMaterial, whiteCount);
    red.castShadow = red.receiveShadow = true;
    white.castShadow = white.receiveShadow = true;
    const matrix = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    let r = 0; let w = 0;
    for (const side of [-1, 1]) {
      for (let i = 0; i < countPerSide; i += 1) {
        const t = i / countPerSide;
        const point = this.curve.getPointAt(t);
        const tangent = this.curve.getTangentAt(t).normalize();
        const normal = new THREE.Vector3().crossVectors(UP, tangent).normalize();
        const position = point.clone().addScaledVector(normal, side * (this.track.roadWidth / 2 + 5.7));
        position.y = 0.55;
        quat.setFromUnitVectors(FORWARD, tangent);
        matrix.compose(position, quat, scale);
        if ((i + (side > 0 ? 1 : 0)) % 2 === 0) red.setMatrixAt(r++, matrix);
        else white.setMatrixAt(w++, matrix);
      }
    }
    red.count = r; white.count = w;
    red.instanceMatrix.needsUpdate = true; white.instanceMatrix.needsUpdate = true;
    this.trackGroup.add(red, white);
  },

createGrandstands() {
    const standMaterial = new THREE.MeshStandardMaterial({ color: 0x252b34, metalness: 0.22, roughness: 0.58 });
    const stripeMaterials = [0xe51c36, 0xf2f2f2, 0x3277e8].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));
    for (let i = 0; i < 6; i += 1) {
      const t = mod(0.06 + i / 6, 1);
      const point = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3().crossVectors(UP, tangent).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const group = new THREE.Group();
      group.position.copy(point).addScaledVector(normal, side * (this.track.roadWidth / 2 + 20));
      group.quaternion.setFromUnitVectors(FORWARD, tangent);
      const base = new THREE.Mesh(new THREE.BoxGeometry(22, 5.5, 8), standMaterial);
      base.position.y = 2.75;
      base.castShadow = true;
      group.add(base);
      for (let row = 0; row < 3; row += 1) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(19, 0.62, 0.18), stripeMaterials[row]);
        stripe.position.set(0, 4.45 - row * 1.25, side > 0 ? -4.1 : 4.1);
        group.add(stripe);
      }
      this.trackGroup.add(group);
    }
  },

createStartLine() {
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 256; textureCanvas.height = 64;
    const ctx = textureCanvas.getContext('2d');
    for (let x = 0; x < 16; x += 1) {
      ctx.fillStyle = x % 2 === 0 ? '#ffffff' : '#111111';
      ctx.fillRect(x * 16, 0, 16, 32);
      ctx.fillStyle = x % 2 === 0 ? '#111111' : '#ffffff';
      ctx.fillRect(x * 16, 32, 16, 32);
    }
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const line = new THREE.Mesh(new THREE.PlaneGeometry(this.track.roadWidth, 2.1), new THREE.MeshBasicMaterial({ map: texture }));
    const point = this.curve.getPointAt(0);
    const tangent = this.curve.getTangentAt(0).normalize();
    line.position.copy(point); line.position.y = 0.07;
    line.rotation.x = -Math.PI / 2;
    line.rotation.z = Math.atan2(tangent.z, tangent.x) + Math.PI / 2;
    this.trackGroup.add(line);
  },

placeOnTrack(object, progress, lateral = 0, height = 0) {
    const point = this.curve.getPointAt(mod(progress, 1));
    const tangent = this.curve.getTangentAt(mod(progress, 1)).normalize();
    const normal = new THREE.Vector3().crossVectors(UP, tangent).normalize();
    object.position.copy(point).addScaledVector(normal, lateral);
    object.position.y += height;
    object.quaternion.setFromUnitVectors(FORWARD, tangent);
  },

updateWorldObjects(dt = 0, boosting = false) {
    if (!this.player || !this.curve) return;
    this.placeOnTrack(this.player.mesh, this.player.progress, this.player.lateral, 0.02);
    this.player.mesh.userData.wheels?.forEach((wheel) => { wheel.rotation.x -= this.player.speed * dt * 1.9; });
    this.player.mesh.userData.flames?.forEach((flame) => {
      flame.visible = boosting;
      flame.scale.y = 0.8 + Math.random() * 0.55;
    });
    this.player.mesh.userData.rearLight.visible = this.inputs.brake;
    this.ai.forEach((car) => this.placeOnTrack(car.mesh, car.progress, car.lateral, 0.02));
    this.updateCamera(boosting);
    if (this.messageTimer > 0) this.messageTimer -= dt;
  },

updateCamera(boosting) {
    const point = this.curve.getPointAt(this.player.progress);
    const tangent = this.curve.getTangentAt(this.player.progress).normalize();
    const normal = new THREE.Vector3().crossVectors(UP, tangent).normalize();
    const desired = point.clone()
      .addScaledVector(normal, this.player.lateral * 0.45)
      .addScaledVector(tangent, -8.6);
    desired.y = 3.25;
    this.camera.position.lerp(desired, 0.11);
    const look = point.clone().addScaledVector(tangent, 11).addScaledVector(normal, this.player.lateral * 0.18);
    look.y = 0.95;
    this.camera.lookAt(look);
    const targetFov = 56 + (this.player.speed / 92) * 8 + (boosting ? 4 : 0);
    this.camera.fov += (targetFov - this.camera.fov) * 0.08;
    this.camera.updateProjectionMatrix();
  },

getMiniMapData(count = 100) {
    return Array.from({ length: count }, (_, index) => this.curve.getPointAt(index / count));
  }
};
