export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.filter = null;
    this.enabled = false;
  }

  async start() {
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
        sub.type = 'square';
        this.engineGain.gain.value = 0.018;
        subGain.gain.value = 0.006;
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 900;
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

  update(speedRatio, nitro) {
    if (!this.enabled || !this.ctx || !this.engineOsc) return;
    const now = this.ctx.currentTime;
    const rpm = 70 + speedRatio * 250 + (nitro ? 45 : 0);
    this.engineOsc.frequency.setTargetAtTime(rpm, now, 0.035);
    this.subOsc.frequency.setTargetAtTime(rpm * 0.48, now, 0.04);
    this.filter.frequency.setTargetAtTime(500 + speedRatio * 1600 + (nitro ? 500 : 0), now, 0.05);
    this.engineGain.gain.setTargetAtTime(0.014 + speedRatio * 0.025, now, 0.06);
  }

  impact(strength = 1) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(85, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
    gain.gain.setValueAtTime(0.06 * strength, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  pickup() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.18);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  }
}
