import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
import { TEAMS, createDrivers } from './config.js';
import { AudioEngine } from './audio.js';
import { worldMethods } from './world.js';
import { sessionMethods } from './session.js';
import { raceMethods } from './race.js';

export class FormulaRushGame {
constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.cb = callbacks;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 900);
    this.audio = new AudioEngine();
    this.inputs = { left: false, right: false, throttle: false, brake: false, ers: false };
    this.drivers = createDrivers();
    this.team = TEAMS[1];
    this.trackIndex = 0;
    this.session = 'Q1';
    this.running = false;
    this.paused = true;
    this.countdown = 0;
    this.lastTime = 0;
    this.trackGroup = new THREE.Group();
    this.dynamicGroup = new THREE.Group();
    this.scene.add(this.trackGroup, this.dynamicGroup);
    this.qualifying = {};
    this.finalGrid = [];
    this.championship = this.drivers.map((driver) => ({ driver, points: 0 }));
    this.message = 'TIENI PREMUTO ACCELERA';
    this.messageTimer = 0;
    this.setupLighting();
    this.resize();
    this.loadTrack(0);
    window.__FORMULA_RUSH__ = {
      getState: () => this.debugState(),
      setInput: (key, value) => this.setInput(key, value),
      completeSession: () => this.debugCompleteSession(),
      skipCountdown: () => { this.countdown = -1; },
      step: (seconds, dt = 1 / 60) => { for (let t = 0; t < seconds; t += dt) this.update(dt); },
      game: this,
    };
    requestAnimationFrame((time) => this.loop(time));
  }
}

Object.assign(FormulaRushGame.prototype, worldMethods, sessionMethods, raceMethods);
