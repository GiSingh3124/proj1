import { TEAMS, TRACKS, POINTS } from './config.js';
import { createF1Car, rand } from './graphics.js';
export const sessionMethods = {
selectTeam(teamId) {
    this.team = TEAMS.find((team) => team.id === teamId) || TEAMS[0];
  },

setAudioEnabled(enabled) {
    return this.audio.setEnabled(enabled);
  },

resetChampionship() {
    this.championship.forEach((entry) => { entry.points = 0; });
    this.trackIndex = 0;
    this.qualifying = {};
    this.finalGrid = [];
    this.loadTrack(0);
  },

beginChampionship() {
    this.resetChampionship();
    this.prepareSession('Q1');
  },

prepareSession(session) {
    this.session = session;
    this.running = false;
    this.paused = true;
    const poolCount = session === 'Q1' || session === 'RACE' ? 22 : session === 'Q2' ? 16 : 10;
    this.cb.onBriefing?.({
      kicker: `GP ${this.trackIndex + 1}/3 • ${this.track.country}`,
      title: `${session} • ${this.track.name}`,
      text: session === 'RACE'
        ? 'Tre giri. Acceleratore manuale, frenata vera e ERS sui rettilinei. Nessun ostacolo piazzato sulla pista.'
        : `${session}: un giro lanciato. In pista sei da solo; la classifica confronta il tuo tempo con gli altri ${poolCount - 1} piloti.`,
      objectives: session === 'Q1' ? ['Tieni premuto ACCELERA', 'Entra nei primi 16', 'Frena prima delle curve lente']
        : session === 'Q2' ? ['Entra nei primi 10', 'Usa ERS sui rettilinei', 'Resta tra le barriere']
          : session === 'Q3' ? ['Attacca la pole', 'Massimizza la velocità d’uscita', 'Completa un giro pulito']
            : ['Tre giri', 'Sorpassa senza contatti', 'Conserva ERS per i rettilinei'],
    });
  },

startDriving() {
    this.resetPlayer();
    this.buildAI();
    this.running = true;
    this.paused = false;
    this.countdown = 3.25;
    this.cb.onDriveStart?.();
  },

resetPlayer() {
    Object.assign(this.player, {
      distance: 0, progress: 0, lateral: 0, lateralVelocity: 0, speed: 0, ers: 100,
      lap: 1, lapTime: 0, totalTime: 0, position: 1, offTrack: false, collisionCooldown: 0,
    });
    this.player.driver = this.drivers.find((driver) => driver.team.id === this.team.id) || this.drivers[0];
    this.player.totalCars = this.session === 'Q1' || this.session === 'RACE' ? 22 : this.session === 'Q2' ? 16 : 10;
    this.player.position = this.player.totalCars;
    this.message = 'TIENI PREMUTO ACCELERA';
    this.messageTimer = 1.5;
  },

buildAI() {
    this.ai.forEach((car) => this.dynamicGroup.remove(car.mesh));
    this.ai = [];
    const pool = this.session === 'Q1' ? this.drivers
      : this.session === 'Q2' ? (this.qualifying.Q1 || []).slice(0, 16).map((entry) => entry.driver)
        : this.session === 'Q3' ? (this.qualifying.Q2 || []).slice(0, 10).map((entry) => entry.driver)
          : this.finalGrid.length ? this.finalGrid.map((entry) => entry.driver) : this.drivers;
    this.qualifyingPool = pool;
    const others = pool.filter((driver) => driver.id !== this.player.driver.id);
    if (this.session === 'RACE') {
      const playerGrid = Math.max(1, this.finalGrid.findIndex((entry) => entry.driver.id === this.player.driver.id) + 1);
      this.player.position = playerGrid;
      others.forEach((driver, index) => {
        const gridPos = this.finalGrid.findIndex((entry) => entry.driver.id === driver.id) + 1 || index + 2;
        const car = {
          driver,
          mesh: createF1Car(driver.team, 0.94),
          distance: Math.max(0, (playerGrid - gridPos) * 7 + 18),
          progress: 0,
          lateral: gridPos % 2 === 0 ? -2.15 : 2.15,
          targetLateral: gridPos % 2 === 0 ? -2.15 : 2.15,
          speed: 72 * driver.skill + rand(-1.5, 1.5),
          totalTime: 0,
        };
        this.dynamicGroup.add(car.mesh);
        this.ai.push(car);
      });
    } else {
      this.aiTimes = others.map((driver) => ({
        driver,
        time: this.track.par / (driver.skill * driver.team.performance * this.track.grip) + rand(-0.5, 0.5),
      }));
    }
  },

setInput(key, value) {
    if (key in this.inputs) this.inputs[key] = Boolean(value);
  },

finishQualifying() {
    this.running = false;
    this.paused = true;
    const playerTime = this.track.par * (this.player.lapTime / Math.max(1, this.trackLength / 74))
      / (this.team.performance * this.player.driver.skill * this.track.grip) + rand(-0.12, 0.12);
    const results = [...this.aiTimes, { driver: this.player.driver, time: playerTime }].sort((a, b) => a.time - b.time);
    this.qualifying[this.session] = results;
    const position = results.findIndex((entry) => entry.driver.id === this.player.driver.id) + 1;
    const cutoff = this.session === 'Q1' ? 16 : 10;
    const advanced = this.session === 'Q3' || position <= cutoff;

    if (this.session === 'Q1' && !advanced) this.finalGrid = this.composeGrid(null, null, results);
    if (this.session === 'Q2' && !advanced) this.finalGrid = this.composeGrid(null, results, this.qualifying.Q1);
    if (this.session === 'Q3') this.finalGrid = this.composeGrid(results, this.qualifying.Q2, this.qualifying.Q1);

    this.cb.onSessionResult?.({
      type: 'QUALIFYING', session: this.session, position, time: playerTime, advanced, results,
      next: () => {
        if (this.session === 'Q1' && advanced) this.prepareSession('Q2');
        else if (this.session === 'Q2' && advanced) this.prepareSession('Q3');
        else this.prepareSession('RACE');
      },
    });
  },

composeGrid(q3, q2, q1) {
    q1 ||= this.qualifying.Q1 || this.drivers.map((driver) => ({ driver, time: 99 }));
    q2 ||= this.qualifying.Q2 || q1.slice(0, 16);
    q3 ||= this.qualifying.Q3 || q2.slice(0, 10);
    const top = q3.slice(0, 10);
    const topIds = new Set(top.map((entry) => entry.driver.id));
    const middle = q2.filter((entry) => !topIds.has(entry.driver.id)).slice(0, 6);
    const used = new Set([...top, ...middle].map((entry) => entry.driver.id));
    const tail = q1.filter((entry) => !used.has(entry.driver.id)).slice(0, 6);
    return [...top, ...middle, ...tail];
  },

finishRace() {
    this.running = false;
    this.paused = true;
    const standings = [
      { driver: this.player.driver, distance: this.player.distance, time: this.player.totalTime, player: true },
      ...this.ai.map((car) => ({ driver: car.driver, distance: car.distance, time: car.totalTime })),
    ].sort((a, b) => b.distance - a.distance);
    const position = standings.findIndex((entry) => entry.player) + 1;
    standings.forEach((entry, index) => {
      const championshipEntry = this.championship.find((item) => item.driver.id === entry.driver.id);
      if (championshipEntry) championshipEntry.points += POINTS[index] || 0;
    });
    const lastTrack = this.trackIndex === TRACKS.length - 1;
    this.cb.onSessionResult?.({
      type: 'RACE', session: 'RACE', position, time: this.player.totalTime, standings, lastTrack,
      next: () => {
        if (lastTrack) {
          this.cb.onChampionshipEnd?.([...this.championship].sort((a, b) => b.points - a.points));
        } else {
          this.loadTrack(this.trackIndex + 1);
          this.qualifying = {};
          this.finalGrid = [];
          this.prepareSession('Q1');
        }
      },
    });
  }
};
