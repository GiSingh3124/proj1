import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
import { TRACKS } from './config.js';
import { buildRibbon, createF1Car, makeTexture } from './graphics.js';

export const trackMethods = {
loadTrack(index) {
    this.trackIndex = index;
    this.track = TRACKS[index];
    this.clearGroup(this.trackGroup);
    this.clearGroup(this.dynamicGroup);
    this.curve = new THREE.CatmullRomCurve3(this.track.points, true, 'catmullrom', 0.08);
    this.trackLength = this.curve.getLength();
    this.scene.background = new THREE.Color(this.track.sky);
    this.scene.fog = new THREE.Fog(this.track.fog, 170, 470);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(1100, 1100),
      new THREE.MeshStandardMaterial({ color: 0x2f6f31, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.08;
    ground.receiveShadow = true;
    this.trackGroup.add(ground);

    const asphaltTexture = makeTexture('asphalt');
    const road = new THREE.Mesh(
      buildRibbon(this.curve, 0, this.track.roadWidth),
      new THREE.MeshStandardMaterial({ map: asphaltTexture, color: 0xffffff, roughness: 0.9, metalness: 0.02 }),
    );
    road.receiveShadow = true;
    road.position.y = 0.02;
    this.trackGroup.add(road);

    const kerbTexture = makeTexture('kerb');
    for (const side of [-1, 1]) {
      const kerb = new THREE.Mesh(
        buildRibbon(this.curve, side * (this.track.roadWidth / 2 + 0.65), 1.3),
        new THREE.MeshStandardMaterial({ map: kerbTexture, roughness: 0.82 }),
      );
      kerb.position.y = 0.055;
      kerb.receiveShadow = true;
      this.trackGroup.add(kerb);
    }

    // Run-off and barriers are generated from the same normal as the road, so they cannot cross the circuit.
    const runoffMaterial = new THREE.MeshStandardMaterial({ color: 0x20252c, roughness: 0.95 });
    for (const side of [-1, 1]) {
      const runoff = new THREE.Mesh(buildRibbon(this.curve, side * (this.track.roadWidth / 2 + 3.0), 4.6), runoffMaterial);
      runoff.position.y = 0.005;
      this.trackGroup.add(runoff);
    }

    this.createBarriers();
    this.createGrandstands();
    this.createStartLine();

    const playerDriver = this.drivers.find((driver) => driver.team.id === this.team.id) || this.drivers[0];
    this.player = {
      driver: playerDriver,
      mesh: createF1Car(this.team, 1),
      distance: 0,
      progress: 0,
      lateral: 0,
      lateralVelocity: 0,
      speed: 0,
      ers: 100,
      lap: 1,
      lapTime: 0,
      totalTime: 0,
      position: 22,
      totalCars: 22,
      offTrack: false,
      collisionCooldown: 0,
    };
    this.dynamicGroup.add(this.player.mesh);
    this.ai = [];
    this.updateWorldObjects();
  }
};
