import { teams, tracks, buildDrivers, buildTrackGeometry } from './data.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min, max) => min + Math.random() * (max - min);
const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '--:--.---';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds - Math.floor(seconds)) * 1000);
  return `${mins}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
};

class HUD {
  constructor() {
    this.el = {
      pos: document.getElementById('hudPos'),
      title: document.getElementById('hudTitle'),
      subtitle: document.getElementById('hudSubtitle'),
      lap: document.getElementById('hudLap'),
      speed: document.getElementById('hudSpeed'),
      ers: document.getElementById('hudErs'),
      ersFill: document.getElementById('ersFill'),
      tyre: document.getElementById('hudTyre'),
      sessionInfo: document.getElementById('sessionInfo'),
      overlay: document.getElementById('overlay'),
      menuCard: document.getElementById('menuCard'),
      resultCard: document.getElementById('resultCard'),
      resultEyebrow: document.getElementById('resultEyebrow'),
      resultTitle: document.getElementById('resultTitle'),
      resultBody: document.getElementById('resultBody'),
      champTable: document.getElementById('champTable'),
    };
  }

  hideOverlay() {
    this.el.overlay.classList.remove('show');
  }

  showMenu() {
    this.el.overlay.classList.add('show');
    this.el.menuCard.classList.remove('hidden');
    this.el.resultCard.classList.add('hidden');
  }

  showResult({ eyebrow, title, body, tableHtml = '' }) {
    this.el.overlay.classList.add('show');
    this.el.menuCard.classList.add('hidden');
    this.el.resultCard.classList.remove('hidden');
    this.el.resultEyebrow.textContent = eyebrow;
    this.el.resultTitle.textContent = title;
    this.el.resultBody.innerHTML = body;
    this.el.champTable.innerHTML = tableHtml;
  }

  update(game) {
    this.el.pos.textContent = `P${game.player.position}`;
    this.el.title.textContent = `${game.weekend.track.name.toUpperCase()} • ${game.mode === 'race' ? 'GARA' : game.phase.toUpperCase()}`;
    this.el.subtitle.textContent = `${game.weekendLabel()} • ${game.team.name}`;
    this.el.lap.textContent = game.mode === 'race'
      ? `${game.player.lap}/${game.weekend.track.laps}`
      : `${formatTime(game.player.lapTime)} • giro`;
    this.el.speed.textContent = `${Math.round(game.player.speed * 42)} km/h`;
    this.el.ers.textContent = `${Math.round(game.player.ers)}%`;
    this.el.ersFill.style.width = `${game.player.ers}%`;
    this.el.tyre.textContent = game.mode === 'race' ? 'MEDIUM' : 'SOFT';
    this.el.sessionInfo.textContent = game.statusLine();
  }
}

class Game {
  constructor(canvas, hud) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hud = hud;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.width = 0;
    this.height = 0;
    this.keys = { left: false, right: false, brake: false, ers: false };
    this.mode = 'menu';
    this.phase = 'q1';
    this.selectedTeamId = teams[0].id;
    this.allDrivers = buildDrivers();
    this.championship = this.allDrivers.map((driver) => ({ id: driver.id, name: driver.name, team: driver.team, points: 0, lastResult: null }));
    this.pendingAction = null;
    this.lastCornerLabel = '';
    this.countdown = 0;
    this.qualifyingGrid = [];
    this.initWeekend(0);
    this.resize();
  }

  initWeekend(index) {
    this.weekend = {
      currentRound: index,
      track: tracks[index],
      geometry: buildTrackGeometry(tracks[index]),
    };
    this.trackLength = this.weekend.geometry.totalSegments * 200;
    this.worldZ = 0;
    this.player = {
      driver: this.allDrivers.find((d) => d.teamId === this.selectedTeamId),
      x: 0,
      z: 0,
      speed: 0,
      maxSpeed: 8.3,
      lap: 1,
      lapTime: 0,
      ers: 100,
      position: 20,
      statusText: 'Weekend pronto',
      raceProgress: 0,
    };
    this.aiCars = [];
  }

  weekendLabel() {
    return `GP ${this.weekend.currentRound + 1}/3`;
  }

  statusLine() {
    if (this.countdown > 0) return this.countdown > 1 ? 'Preparati...' : 'VIA';
    if (this.mode === 'qualifying') {
      const target = this.phase === 'q1' ? 'top 15' : this.phase === 'q2' ? 'top 10' : 'lotta per la pole';
      return `${this.phase.toUpperCase()} • ${target} • ${this.player.statusText}`;
    }
    if (this.mode === 'race') {
      return `${this.weekend.track.country} • ${this.player.statusText}`;
    }
    return 'Scegli una scuderia e avvia il campionato.';
  }

  selectTeam(teamId) {
    this.selectedTeamId = teamId;
    this.team = teams.find((t) => t.id === teamId) || teams[0];
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  startChampionship() {
    this.championship.forEach((entry) => { entry.points = 0; entry.lastResult = null; });
    this.initWeekend(0);
    this.phase = 'q1';
    this.setupQualifying();
  }

  setupQualifying() {
    this.mode = 'qualifying';
    this.countdown = 2.4;
    this.player.driver = this.allDrivers.find((d) => d.teamId === this.selectedTeamId);
    this.player.x = 0;
    this.player.z = 0;
    this.player.speed = 0;
    this.player.lap = 1;
    this.player.lapTime = 0;
    this.player.ers = 100;
    this.player.position = 20;
    this.player.statusText = 'Spingi adesso';
    const pool = this.qualifyingGrid.length
      ? this.qualifyingGrid.slice(0, this.phase === 'q2' ? 15 : 10).map((e) => e.driver)
      : this.allDrivers;
    this.aiTimes = pool.filter((d) => d.id !== this.player.driver.id).map((driver) => ({
      driver,
      time: this.weekend.track.parTime / (driver.skill * driver.team.pace) + rand(-0.55, 0.65),
    }));
  }

  setupRace() {
    this.mode = 'race';
    this.countdown = 2.4;
    const grid = this.qualifyingGrid.length ? this.qualifyingGrid : this.buildGrid(this.weekend.track.parTime + 2);
    this.player.driver = this.allDrivers.find((d) => d.teamId === this.selectedTeamId);
    this.player.position = grid.findIndex((e) => e.driver.id === this.player.driver.id) + 1;
    this.player.x = this.player.position % 2 === 0 ? 0.18 : -0.18;
    this.player.z = 0;
    this.player.speed = 0;
    this.player.lap = 1;
    this.player.lapTime = 0;
    this.player.ers = 100;
    this.player.statusText = 'Luci spente e si parte';
    this.aiCars = grid
      .filter((entry) => entry.driver.id !== this.player.driver.id)
      .map((entry, index) => ({
        driver: entry.driver,
        color: entry.driver.team.color,
        x: index % 2 === 0 ? -0.22 : 0.22,
        z: (index + 1) * 95,
        speed: 4.9 + Math.random() * 0.9,
        lap: 1,
        raceProgress: 0,
      }));
  }

  buildGrid(playerTime) {
    this.qualifyingGrid = [...this.aiTimes, { driver: this.player.driver, time: playerTime }].sort((a, b) => a.time - b.time);
    return this.qualifyingGrid;
  }

  continueFromOverlay() {
    if (!this.pendingAction) return;
    this.hud.hideOverlay();
    const action = this.pendingAction;
    this.pendingAction = null;
    action();
  }

  update(dt) {
    if (this.mode === 'menu' || this.mode === 'paused') return;
    if (this.countdown > 0) {
      this.countdown -= dt;
      return;
    }
    if (this.mode === 'qualifying') this.updateQualifying(dt);
    if (this.mode === 'race') this.updateRace(dt);
  }

  updateQualifying(dt) {
    this.updatePlayerPhysics(dt, true);
    this.player.lapTime += dt;
    this.worldZ = this.player.z;
    if (this.player.z >= this.trackLength) {
      const paceFactor = this.team.pace * this.player.driver.skill;
      const speedFactor = lerp(0.985, 1.012, clamp((this.player.speed - 5) / 3, 0, 1));
      const playerTime = this.player.lapTime / (paceFactor * speedFactor) + rand(-0.2, 0.2);
      const grid = this.buildGrid(playerTime);
      const pos = grid.findIndex((entry) => entry.driver.id === this.player.driver.id) + 1;
      this.player.position = pos;
      const advanced = (this.phase === 'q1' && pos <= 15) || (this.phase === 'q2' && pos <= 10) || this.phase === 'q3';
      const body = `Il tuo giro è <b>${formatTime(playerTime)}</b>. ${advanced ? (this.phase === 'q3' ? 'La griglia è definita.' : `Passi in <b>${this.phase === 'q1' ? 'Q2' : 'Q3'}</b>.`) : `Sei eliminato in <b>${this.phase.toUpperCase()}</b>.`}`;
      const table = grid.slice(0, 10).map((entry, idx) => `<div class="row ${entry.driver.id === this.player.driver.id ? 'you' : ''}"><span>P${idx + 1} • ${entry.driver.name}</span><span>${formatTime(entry.time)}</span></div>`).join('');
      this.pendingAction = () => {
        if (this.phase === 'q1' && advanced) {
          this.phase = 'q2';
          this.setupQualifying();
        } else if (this.phase === 'q2' && advanced) {
          this.phase = 'q3';
          this.setupQualifying();
        } else {
          this.setupRace();
        }
      };
      this.mode = 'paused';
      this.hud.showResult({ eyebrow: 'Qualifica', title: `${this.phase.toUpperCase()} completata • P${pos}`, body, tableHtml: table });
    }
  }

  updateRace(dt) {
    this.updatePlayerPhysics(dt, false);
    this.player.lapTime += dt;
    this.worldZ = this.player.z;
    this.player.statusText = this.player.position <= 3 ? 'Zona podio' : 'Vai a prendere chi è davanti';

    this.aiCars.forEach((car) => {
      car.speed = clamp(car.speed + rand(-0.12, 0.12) * dt, 4.8, 7.9);
      car.z += car.speed * 92 * dt;
      if (car.z >= this.trackLength) {
        car.z -= this.trackLength;
        car.lap += 1;
      }
      car.raceProgress = (car.lap - 1) * this.trackLength + car.z;
    });

    this.player.raceProgress = (this.player.lap - 1) * this.trackLength + this.player.z;
    const standings = [{ id: this.player.driver.id, driver: this.player.driver, progress: this.player.raceProgress, player: true }]
      .concat(this.aiCars.map((car) => ({ id: car.driver.id, driver: car.driver, progress: car.raceProgress })))
      .sort((a, b) => b.progress - a.progress);
    this.player.position = standings.findIndex((entry) => entry.player) + 1;

    for (const car of this.aiCars) {
      const dz = car.z - this.player.z;
      if (Math.abs(dz) < 120 && Math.abs(car.x - this.player.x) < 0.19) {
        this.player.speed *= 0.93;
        this.player.statusText = 'Contatto!';
      }
    }

    if (this.player.z >= this.trackLength) {
      this.player.z -= this.trackLength;
      this.player.lap += 1;
      if (this.player.lap > this.weekend.track.laps) {
        this.finishRace(standings);
      }
    }
  }

  finishRace(standings) {
    const pointsMap = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    standings.forEach((entry, idx) => {
      const champ = this.championship.find((c) => c.id === entry.id);
      if (champ) {
        champ.points += pointsMap[idx] || 0;
        champ.lastResult = idx + 1;
      }
    });
    const pos = standings.findIndex((entry) => entry.id === this.player.driver.id) + 1;
    const sortedChamp = [...this.championship].sort((a, b) => b.points - a.points);
    const table = sortedChamp.slice(0, 8).map((entry, idx) => `<div class="row ${entry.id === this.player.driver.id ? 'you' : ''}"><span>P${idx + 1} • ${entry.name}</span><span>${entry.points} pt</span></div>`).join('');
    const lastRound = this.weekend.currentRound >= tracks.length - 1;
    const body = lastRound
      ? `Hai chiuso l'ultimo GP in <b>P${pos}</b>. Ecco la classifica finale del mini campionato.`
      : `Hai finito la gara in <b>P${pos}</b>. Il prossimo weekend è pronto.`;
    this.pendingAction = () => {
      if (lastRound) {
        this.mode = 'menu';
        this.phase = 'q1';
        this.qualifyingGrid = [];
        this.initWeekend(0);
        this.hud.showMenu();
      } else {
        this.phase = 'q1';
        this.qualifyingGrid = [];
        this.initWeekend(this.weekend.currentRound + 1);
        this.setupQualifying();
      }
    };
    this.mode = 'paused';
    this.hud.showResult({ eyebrow: 'Campionato', title: lastRound ? 'Campionato finito' : `${this.weekend.track.name} • Gara conclusa`, body, tableHtml: table });
  }

  updatePlayerPhysics(dt, qualifying) {
    const currentSegment = this.segmentAt(this.player.z);
    const baseSpeed = qualifying ? 5.1 : 5.5;
    let accel = 2.0;
    if (this.keys.brake) accel = -5.1;
    if (Math.abs(currentSegment.curve) > 0.65 && !this.keys.brake) accel = -1.8;
    if (this.keys.ers && this.player.ers > 0) {
      accel += 1.8;
      this.player.ers = Math.max(0, this.player.ers - 18 * dt);
    } else {
      this.player.ers = Math.min(100, this.player.ers + 7 * dt);
    }
    this.player.speed = clamp(this.player.speed + accel * dt, baseSpeed * 0.45, this.player.maxSpeed);
    this.player.z += this.player.speed * 100 * dt;
    const steer = (this.keys.left ? -1 : 0) + (this.keys.right ? 1 : 0);
    this.player.x = clamp(this.player.x + steer * dt * 1.6 - currentSegment.curve * dt * 0.7, -1.02, 1.02);
    if (Math.abs(this.player.x) > 0.92) this.player.speed *= 0.985;
  }

  segmentAt(z) {
    const index = Math.floor((z / 200) % this.weekend.geometry.totalSegments);
    return this.weekend.geometry.segments[(index + this.weekend.geometry.totalSegments) % this.weekend.geometry.totalSegments];
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#5d95ff');
    sky.addColorStop(0.48, '#cce6ff');
    sky.addColorStop(0.49, '#6cba5c');
    sky.addColorStop(1, '#285126');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    this.renderRoad();
    this.renderCars();
    this.hud.update(this);
  }

  renderRoad() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const horizon = h * 0.3;
    const roadBase = w * 0.46;
    const cameraZ = this.player.z;
    let x = 0;
    let dx = 0;
    let lastLeft = 0;
    let lastRight = w;

    for (let n = 0; n < 110; n += 1) {
      const segment = this.segmentAt(cameraZ + n * 200);
      const perspective = n / 110;
      const y = lerp(h, horizon, perspective);
      const width = lerp(roadBase, w * 0.08, perspective);
      dx += segment.curve * 0.0009;
      x += dx;
      const center = w / 2 + x * w;
      const left = center - width / 2;
      const right = center + width / 2;
      const prevY = n === 0 ? h : lerp(h, horizon, (n - 1) / 110);

      ctx.fillStyle = n % 2 === 0 ? '#3a4048' : '#333941';
      ctx.beginPath();
      ctx.moveTo(lastLeft, prevY);
      ctx.lineTo(lastRight, prevY);
      ctx.lineTo(right, y);
      ctx.lineTo(left, y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = n % 2 === 0 ? '#d92332' : '#f6f6f6';
      const kerb = width * 0.06;
      ctx.fillRect(left - kerb, y, kerb, prevY - y + 1);
      ctx.fillRect(right, y, kerb, prevY - y + 1);

      if (n % 6 === 0) {
        ctx.fillStyle = '#a9b3bf';
        ctx.fillRect(center - 2, y, 4, prevY - y - 4);
      }

      if (segment.label && n > 20 && n < 35) this.lastCornerLabel = segment.label;
      lastLeft = left;
      lastRight = right;
    }

    ctx.fillStyle = 'rgba(8,11,17,.58)';
    ctx.fillRect(w * 0.28, horizon + 8, w * 0.44, 32);
    ctx.fillStyle = '#f4f8ff';
    ctx.font = '700 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(this.lastCornerLabel || this.weekend.track.name, w / 2, horizon + 28);
  }

  renderCars() {
    const w = this.width;
    const h = this.height;
    const playerY = h * 0.77;
    const visibleCars = this.aiCars
      .map((car) => ({ ...car, dz: car.z - this.player.z }))
      .filter((car) => car.dz > -100 && car.dz < 1400)
      .sort((a, b) => b.dz - a.dz);

    visibleCars.forEach((car) => {
      const depth = clamp(car.dz / 1400, 0.05, 1);
      const scale = lerp(1.06, 0.26, depth);
      const y = lerp(playerY - 30, h * 0.38, 1 - depth);
      const x = this.projectX(car.x, depth);
      this.drawCar(x, y, scale, car.driver.team.color, false);
    });

    this.drawCar(w / 2 + this.player.x * 120, playerY, 1.08, this.team.color, true);
  }

  projectX(trackX, depth) {
    return this.width / 2 + trackX * lerp(this.width * 0.34, this.width * 0.08, depth);
  }

  drawCar(x, y, scale, color, player) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    if (player) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 22;
    }
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    ctx.fillRect(-20, -6, 40, 44);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(-28, 0, 10, 12);
    ctx.fillRect(18, 0, 10, 12);
    ctx.fillRect(-28, 24, 10, 12);
    ctx.fillRect(18, 24, 10, 12);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-15, -12, 30, 44, 6);
    ctx.fill();
    ctx.fillRect(-24, -6, 48, 6);
    ctx.fillRect(-28, 28, 56, 6);
    ctx.beginPath();
    ctx.moveTo(-8, -12);
    ctx.lineTo(0, -28);
    ctx.lineTo(8, -12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#11151c';
    ctx.beginPath();
    ctx.roundRect(-7, 3, 14, 16, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.68)';
    ctx.fillRect(-8, -8, 16, 2);
    ctx.restore();
  }
}

const canvas = document.getElementById('gameCanvas');
const hud = new HUD();
const game = new Game(canvas, hud);
const teamSelect = document.getElementById('teamSelect');
const startBtn = document.getElementById('startBtn');
const continueBtn = document.getElementById('continueBtn');
const fullBtn = document.getElementById('fullBtn');

teams.forEach((team) => {
  const option = document.createElement('option');
  option.value = team.id;
  option.textContent = team.name;
  teamSelect.appendChild(option);
});
game.selectTeam(teamSelect.value);

teamSelect.addEventListener('change', (e) => game.selectTeam(e.target.value));
startBtn.addEventListener('click', () => {
  game.selectTeam(teamSelect.value);
  game.startChampionship();
  hud.hideOverlay();
});
continueBtn.addEventListener('click', () => game.continueFromOverlay());
fullBtn.addEventListener('click', () => {
  const el = document.documentElement;
  const fn = el.requestFullscreen || el.webkitRequestFullscreen;
  if (fn) Promise.resolve(fn.call(el)).catch(() => {});
});

function bindControl(el, key) {
  const down = (e) => { e.preventDefault(); game.keys[key] = true; el.classList.add('active'); };
  const up = (e) => { e.preventDefault(); game.keys[key] = false; el.classList.remove('active'); };
  el.addEventListener('pointerdown', down, { passive: false });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => el.addEventListener(ev, up, { passive: false }));
}
document.querySelectorAll('[data-key]').forEach((el) => bindControl(el, el.dataset.key));
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
window.addEventListener('resize', () => game.resize(), { passive: true });

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  game.update(dt);
  game.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
