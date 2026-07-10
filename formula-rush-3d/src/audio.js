export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.osc = null;
    this.gain = null;
    this.filter = null;
    this.enabled = false;
  }

  async setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      if (this.gain && this.ctx) this.gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.04);
      return;
    }
    try {
      this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      if (!this.osc) {
        this.osc = this.ctx.createOscillator();
        this.gain = this.ctx.createGain();
        this.filter = this.ctx.createBiquadFilter();
        this.osc.type = 'sawtooth';
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 600;
        this.gain.gain.value = 0.0001;
        this.osc.connect(this.filter).connect(this.gain).connect(this.ctx.destination);
        this.osc.start();
      }
      this.gain.gain.setTargetAtTime(0.008, this.ctx.currentTime, 0.08);
    } catch (_) {
      this.enabled = false;
    }
  }

  update(speedRatio, throttle, boost) {
    if (!this.enabled || !this.ctx || !this.osc) return;
    const now = this.ctx.currentTime;
    const rpm = 85 + speedRatio * 210 + (boost ? 24 : 0);
    this.osc.frequency.setTargetAtTime(rpm, now, 0.055);
    this.filter.frequency.setTargetAtTime(420 + speedRatio * 1050, now, 0.08);
    const volume = throttle ? 0.009 + speedRatio * 0.009 : 0.004 + speedRatio * 0.004;
    this.gain.gain.setTargetAtTime(volume, now, 0.08);
  }

  impact() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(70, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now); osc.stop(now + 0.15);
  }
}
