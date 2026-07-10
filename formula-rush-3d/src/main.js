import { FormulaRushGame } from './game.js';
import { TEAMS } from './config.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const overlay = $('overlay');
const hud = $('hud');
const controls = $('controls');
const countdown = $('countdown');
const speedLines = $('speedLines');
const flash = $('flash');

const screens = {
  home: $('homeScreen'),
  briefing: $('briefingScreen'),
  result: $('resultScreen'),
  finish: $('finishScreen'),
};

const ui = {
  pos: $('pos'), session: $('session'), trackName: $('trackName'), lapLabel: $('lapLabel'), lap: $('lap'),
  speed: $('speed'), nitroPct: $('nitroPct'), nitroFill: $('nitroFill'), raceMessage: $('raceMessage'),
  teamSelect: $('teamSelect'), briefingKicker: $('briefingKicker'), briefingTitle: $('briefingTitle'),
  briefingText: $('briefingText'), objectives: $('objectives'), resultKicker: $('resultKicker'),
  resultTitle: $('resultTitle'), resultText: $('resultText'), resultsTable: $('resultsTable'),
  championTitle: $('championTitle'), championText: $('championText'), championshipTable: $('championshipTable'),
  mapCanvas: $('mapCanvas')
};

TEAMS.forEach(team => {
  const option = document.createElement('option');
  option.value = team.id;
  option.textContent = team.name;
  ui.teamSelect.appendChild(option);
});
ui.teamSelect.value = 'ferrari';

let pendingNext = null;
let mapPoints = [];

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => el.classList.toggle('active', key === name));
  overlay.classList.add('show');
}

function hideOverlay() {
  overlay.classList.remove('show');
}

function makeResultRows(results, playerId, mode = 'time') {
  return results.slice(0, 22).map((entry, index) => {
    const driver = entry.driver;
    const isPlayer = driver.id === playerId;
    let value = '';
    if (mode === 'time') {
      const secs = entry.time;
      const min = Math.floor(secs / 60);
      const sec = Math.floor(secs % 60);
      const ms = Math.floor((secs % 1) * 1000);
      value = `${min}:${String(sec).padStart(2,'0')}.${String(ms).padStart(3,'0')}`;
    } else if (mode === 'points') {
      value = `${entry.points} PT`;
    } else {
      value = index === 0 ? 'VINCITORE' : `+${Math.max(0, entry.time - results[0].time).toFixed(2)}s`;
    }
    return `<div class="result-row ${isPlayer ? 'you' : ''}"><b>P${index + 1}</b><div><span>${driver.name}</span><div class="team">${driver.team.name}</div></div><strong>${value}</strong></div>`;
  }).join('');
}

function showBriefing(data) {
  ui.briefingKicker.textContent = data.kicker;
  ui.briefingTitle.textContent = data.title;
  ui.briefingText.textContent = data.text;
  ui.objectives.innerHTML = data.objectives.map((item, i) => `<div class="objective"><i>${i + 1}</i><span>${item}</span></div>`).join('');
  showScreen('briefing');
  hud.classList.add('hidden');
  controls.classList.add('hidden');
  mapPoints = game.getMiniMapData();
  drawMiniMap(0);
}

function showSessionResult(result) {
  pendingNext = result.next;
  hud.classList.add('hidden');
  controls.classList.add('hidden');
  countdown.textContent = '';

  if (result.type === 'QUALIFYING') {
    ui.resultKicker.textContent = `${result.session} • QUALIFICA`;
    ui.resultTitle.textContent = `P${result.position}`;
    const outcome = result.session === 'Q3'
      ? (result.position === 1 ? 'Pole position. Hai messo tutti in fila.' : 'Griglia definita. Adesso conta la gara.')
      : (result.advanced ? `Passi alla sessione successiva.` : `Eliminato in ${result.session}. Partirai dalla P${result.position}.`);
    ui.resultText.innerHTML = `Tempo: <b>${formatTime(result.time)}</b><br>${outcome}`;
    ui.resultsTable.innerHTML = makeResultRows(result.results, game.player.driver.id, 'time');
  } else {
    ui.resultKicker.textContent = `${game.track.name.toUpperCase()} • GARA`;
    ui.resultTitle.textContent = `P${result.position}`;
    ui.resultText.innerHTML = `Tempo gara: <b>${formatTime(result.time)}</b><br>Knockdown: <b>${result.knockdowns}</b>. ${result.position <= 3 ? 'Podio conquistato.' : 'Punti preziosi, ma il muretto ne vuole altri.'}`;
    ui.resultsTable.innerHTML = makeResultRows(result.standings, game.player.driver.id, 'gap');
  }
  showScreen('result');
}

function showChampionship(entries) {
  const playerEntry = entries.find(e => e.driver.id === game.player.driver.id);
  const position = entries.indexOf(playerEntry) + 1;
  ui.championTitle.textContent = position === 1 ? 'CAMPIONE!' : `P${position} FINALE`;
  ui.championText.textContent = position === 1
    ? 'Hai vinto il mini campionato. Il telefono è ancora intero: doppio successo.'
    : `Campionato concluso con ${playerEntry.points} punti. C’è margine per una rivincita.`;
  ui.championshipTable.innerHTML = makeResultRows(entries, game.player.driver.id, 'points');
  hud.classList.add('hidden');
  controls.classList.add('hidden');
  showScreen('finish');
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins}:${String(secs).padStart(2,'0')}.${String(ms).padStart(3,'0')}`;
}

function updateHUD(data) {
  ui.pos.textContent = `${data.position}/${data.totalCars}`;
  ui.session.textContent = data.session;
  ui.trackName.textContent = data.track.toUpperCase();
  ui.lapLabel.textContent = data.session === 'RACE' ? 'GIRO' : 'SESSIONE';
  ui.lap.textContent = `${data.lap}/${data.laps}`;
  ui.speed.textContent = data.speed;
  ui.nitroPct.textContent = `${data.nitro}%`;
  ui.nitroFill.style.width = `${data.nitro}%`;
  ui.raceMessage.textContent = data.message;
  speedLines.style.opacity = data.nitroActive ? '.62' : data.speed > 285 ? '.18' : '0';
  drawMiniMap(data.progress);
}

function drawMiniMap(progress) {
  if (!mapPoints.length) return;
  const c = ui.mapCanvas;
  const rect = c.getBoundingClientRect();
  const dpr = Math.min(2, devicePixelRatio || 1);
  c.width = Math.max(1, Math.floor(rect.width * dpr));
  c.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,rect.width,rect.height);

  const xs = mapPoints.map(p => p.x);
  const zs = mapPoints.map(p => p.z);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const pad = 12;
  const scale = Math.min((rect.width-pad*2)/(maxX-minX || 1),(rect.height-pad*2)/(maxZ-minZ || 1));
  const map = p => ({x:pad+(p.x-minX)*scale,y:rect.height-pad-(p.z-minZ)*scale});

  ctx.strokeStyle = 'rgba(255,255,255,.35)';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  mapPoints.forEach((p,i)=>{const m=map(p); i?ctx.lineTo(m.x,m.y):ctx.moveTo(m.x,m.y);});
  ctx.closePath();
  ctx.stroke();

  const p = mapPoints[Math.floor(progress * mapPoints.length) % mapPoints.length];
  const m = map(p);
  ctx.fillStyle = '#ff344d';
  ctx.beginPath();ctx.arc(m.x,m.y,4.5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle = 'white';ctx.lineWidth=1.5;ctx.stroke();
}

function impactFlash() {
  flash.animate([{opacity:.65},{opacity:0}],{duration:260,easing:'ease-out'});
}

const game = new FormulaRushGame(canvas, {
  onBriefing: showBriefing,
  onDriveStart: () => {
    hideOverlay();
    hud.classList.remove('hidden');
    controls.classList.remove('hidden');
  },
  onCountdown: value => {
    if (value > 0) {
      countdown.textContent = Math.ceil(value);
      countdown.style.color = '#ff344d';
    } else if (value > -.55) {
      countdown.textContent = 'GO!';
      countdown.style.color = '#68f5ff';
    } else {
      countdown.textContent = '';
    }
  },
  onHUD: updateHUD,
  onImpact: impactFlash,
  onSessionResult: showSessionResult,
  onChampionshipEnd: showChampionship,
});

game.selectTeam(ui.teamSelect.value);
ui.teamSelect.addEventListener('change', e => game.selectTeam(e.target.value));

$('startBtn').addEventListener('click', () => {
  game.selectTeam(ui.teamSelect.value);
  game.beginChampionship();
});

$('driveBtn').addEventListener('click', () => game.startDriving());
$('continueBtn').addEventListener('click', () => {
  if (pendingNext) {
    const next = pendingNext;
    pendingNext = null;
    next();
  }
});
$('restartBtn').addEventListener('click', () => {
  game.resetChampionship();
  showScreen('home');
});
$('fullscreenBtn').addEventListener('click', async () => {
  try {
    const el = document.documentElement;
    await (el.requestFullscreen?.() || el.webkitRequestFullscreen?.());
    await screen.orientation?.lock?.('portrait');
  } catch (_) {}
});

function bindControl(element, key) {
  const down = e => {
    e.preventDefault();
    element.classList.add('active');
    game.setInput(key, true);
    game.audio.start();
  };
  const up = e => {
    e.preventDefault();
    element.classList.remove('active');
    game.setInput(key, false);
  };
  element.addEventListener('pointerdown', down, {passive:false});
  ['pointerup','pointercancel','pointerleave'].forEach(type => element.addEventListener(type, up, {passive:false}));
}

document.querySelectorAll('[data-key]').forEach(el => bindControl(el, el.dataset.key));
document.addEventListener('touchmove', e => e.preventDefault(), {passive:false});
window.addEventListener('resize', () => {
  game.resize();
  drawMiniMap(game.player?.progress || 0);
}, {passive:true});

showScreen('home');
