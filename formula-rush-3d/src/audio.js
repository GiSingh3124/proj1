export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.filter = null;
    this.enabled = false;
    this.userEnabled = false;
  }

  async setEnabled(value) {
    this.userEnabled = Boolean(value);
    if (!this.userEnabled) {
      this.enabled = false;
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.04);
      }
      return false;
    }
    await this.start();
    return this.enabled;
  }

  async toggle() {
    return this.setEnabled(!this.userEnabled);
  }

  async start() {
    if (!this.userEnabled) return;
    try {
      this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      if (!this.engineOsc) {
        this.engineOsc = this.ctx.createOscillator();
        const sub = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        const subGain = this.ctx.createGain();
        this.filter = this.ctx.createBiquadFilter();
        this.engineOsc.type = 'sawtooth';
        sub.type = 'triangle';
        this.engineGain.gain.value = 0.0001;
        subGain.gain.value = 0.002;
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 650;
        this.engineOsc.connect(this.engineGain).connect(this.filter).connect(this.ctx.destination);
        sub.connect(subGain).connect(this.filter);
        this.engineOsc.start();
        sub.start();
        this.subOsc = sub;
      }
      this.enabled = true;
    } catch (_) {
      this.enabled = false;
    }
  }

  update(speedRatio, nitro, throttle = 0) {
    if (!this.enabled || !this.ctx || !this.engineOsc) return;
    const now = this.ctx.currentTime;
    const rpm = 85 + speedRatio * 240 + throttle * 42 + (nitro ? 28 : 0);
    this.engineOsc.frequency.setTargetAtTime(rpm, now, 0.055);
    this.subOsc.frequency.setTargetAtTime(rpm * 0.45, now, 0.065);
    this.filter.frequency.setTargetAtTime(420 + speedRatio * 1150 + throttle * 300, now, 0.08);
    this.engineGain.gain.setTargetAtTime(0.004 + speedRatio * 0.009 + throttle * 0.004, now, 0.08);
  }

  impact(strength = 1) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(72, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);
    gain.gain.setValueAtTime(0.025 * strength, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  pickup() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
    gain.gain.setValueAtTime(0.018, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }
}
