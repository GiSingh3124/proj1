import { clamp, mod, rand, formatTime } from './utils.js';

export const drivingMethods = {
  setInput(key, value) {
      if (key in this.inputs) this.inputs[key] = Boolean(value);
    },

  update(dt) {
      if (!this.player) return;
      if (this.countdown > 0) {
        this.countdown -= dt;
        this.cb.onCountdown?.(this.countdown);
        this.updateWorldObjects(dt);
        return;
      }
      if (!this.running || this.paused) {
        this.updateWorldObjects(dt);
        return;
      }
  
      const p = this.player;
      const throttle = this.inputs.throttle;
      const boosting = this.inputs.ers && p.ers > 0 && throttle && p.speed > 35;
      const maxSpeed = boosting ? 97 : 92; // 349 / 331 km/h
      let acceleration = throttle ? 24 : -7.5;
      if (this.inputs.brake) acceleration = -52;
      if (boosting) {
        acceleration += 12;
        p.ers = clamp(p.ers - 22 * dt, 0, 100);
      } else {
        p.ers = clamp(p.ers + 4.5 * dt, 0, 100);
      }
      p.speed = clamp(p.speed + acceleration * dt, 0, maxSpeed);
  
      const steer = (this.inputs.right ? 1 : 0) - (this.inputs.left ? 1 : 0);
      const steeringAuthority = 7.2 + (1 - p.speed / maxSpeed) * 4.2;
      p.lateralVelocity += steer * steeringAuthority * dt;
      p.lateralVelocity *= Math.pow(0.045, dt);
      p.lateral += p.lateralVelocity * dt;
  
      const trackLimit = this.track.roadWidth / 2 - 1.1;
      const hardLimit = this.track.roadWidth / 2 + 3.6;
      p.offTrack = Math.abs(p.lateral) > trackLimit;
      p.lateral = clamp(p.lateral, -hardLimit, hardLimit);
      if (p.offTrack) {
        p.speed *= Math.pow(0.94, dt * 60);
        this.setMessage('FUORI PISTA', 0.5);
      }
  
      p.distance += p.speed * dt;
      p.progress = mod(p.distance / this.trackLength, 1);
      p.lapTime += dt;
      p.totalTime += dt;
      if (p.collisionCooldown > 0) p.collisionCooldown -= dt;
  
      if (this.session === 'RACE') {
        this.updateAI(dt);
        this.handleCollisions();
        this.updatePositions();
        if (p.distance >= this.track.laps * this.trackLength) this.finishRace();
      } else if (p.distance >= this.trackLength) {
        this.finishQualifying();
      }
  
      this.updateWorldObjects(dt, boosting);
      this.audio.update(p.speed / maxSpeed, throttle, boosting);
      this.cb.onHUD?.(this.getHUD(boosting));
    },

  updateAI(dt) {
      this.ai.forEach((car, index) => {
        const target = 78 * car.driver.skill * car.driver.team.performance + Math.sin(performance.now() * 0.0005 + index) * 1.2;
        car.speed += (target - car.speed) * dt * 0.55;
        car.distance += car.speed * dt;
        car.progress = mod(car.distance / this.trackLength, 1);
        car.totalTime += dt;
        if (Math.random() < 0.002) car.targetLateral = rand(-2.7, 2.7);
        car.lateral += (car.targetLateral - car.lateral) * dt * 0.7;
      });
    },

  handleCollisions() {
      if (this.player.collisionCooldown > 0) return;
      for (const car of this.ai) {
        const longitudinal = Math.abs(this.player.distance - car.distance);
        const lateral = Math.abs(this.player.lateral - car.lateral);
        if (longitudinal < 3.8 && lateral < 1.65) {
          this.player.speed *= 0.68;
          car.speed *= 0.88;
          this.player.lateralVelocity += this.player.lateral < car.lateral ? -0.55 : 0.55;
          this.player.collisionCooldown = 0.55;
          this.audio.impact();
          navigator.vibrate?.(35);
          this.cb.onImpact?.();
          this.setMessage('CONTATTO', 0.8);
          break;
        }
      }
    },

  updatePositions() {
      const entries = [{ player: true, distance: this.player.distance }, ...this.ai.map((car) => ({ distance: car.distance }))]
        .sort((a, b) => b.distance - a.distance);
      this.player.position = entries.findIndex((entry) => entry.player) + 1;
    },

  setMessage(message, duration = 1) {
      this.message = message;
      this.messageTimer = duration;
    },

  getHUD(boosting = false) {
      if (this.messageTimer <= 0) {
        if (!this.inputs.throttle && this.player.speed < 4) this.message = 'TIENI PREMUTO ACCELERA';
        else if (this.player.offTrack) this.message = 'RIENTRA IN PISTA';
        else this.message = this.session === 'RACE'
          ? `P${this.player.position} • ${formatTime(this.player.totalTime)}`
          : `${this.session} • ${formatTime(this.player.lapTime)}`;
      }
      return {
        session: this.session,
        track: this.track.name,
        position: this.player.position,
        totalCars: this.player.totalCars,
        lap: this.session === 'RACE' ? Math.min(this.track.laps, Math.floor(this.player.distance / this.trackLength) + 1) : 1,
        laps: this.session === 'RACE' ? this.track.laps : 1,
        speed: Math.round(this.player.speed * 3.6),
        ers: Math.round(this.player.ers),
        message: this.message,
        boostActive: boosting,
        progress: this.player.progress,
      };
    }
};
