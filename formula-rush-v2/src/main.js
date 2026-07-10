import { FormulaRushGame } from './game.js';
import { TEAMS } from './config.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const overlay = $('overlay');
const hud = $('hud');
const controls = $('controls');
const countdown = $('countdown');
const speedLines = $('speedLines');
const soundBtn = $('soundBtn');

const screens = {
  home: $('homeScreen'),
  briefing: $('briefingScreen'),
  result: $('resultScreen'),
  finish: $('finishScreen'),
};

const ui = {
  pos: $('pos'), session: $('session'), trackName: $('trackName'), lapLabel: $('lapLabel'), lap: $('lap'),
  speed: $('speed'), ersPct: $('ersPct'), ersFill: $('ersFill'), raceMessage: $('raceMessage'),
  teamSelect: $('teamSelect'), briefingKicker: $('briefingKicker'), briefingTitle: $('briefingTitle'),
  briefingText: $('briefingText'), objectives: $('objectives'), resultKicker: $('resultKicker'),
  resultTitle: $('resultTitle'), resultText: $('resultText'), resultsTable: $('resultsTable'),
  championTitle: $('championTitle'), championText: $('championText'), championshipTable: $('championshipTable'),
};

TEAMS.forEach((team) => {
  const option = document.createElement('option');
  option.value = team.id;
  option.textContent = team.name;
  ui.teamSelect.appendChild(option);
});
ui.teamSelect.value = 'ferrari';

let pendingNext = null;
let audioEnabled = false;

function showScreen(name) {
  Object.entries(screens).forEach(([key, element]) => element.classList.toggle('active', key === name));
  overlay.classList.add('show');
}

function hideOverlay() {
  overlay.classList.remove('show');
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function makeRows(results, playerId, mode = 'time') {
  return results.slice(0, 22).map((entry, index) => {
    const driver = entry.driver;
    const isPlayer = driver.id === playerId;
    const value = mode === 'points' ? `${entry.points} PT`
      : mode === 'gap' ? (index === 0 ? 'VINCITORE' : `+${Math.max(0, entry.time - results[0].time).toFixed(2)}s`)
        : formatTime(entry.time);
    return `<div class="resultRow ${isPlayer ? 'you' : ''}"><b>P${index + 1}</b><div><span>${driver.name}</span><small>${driver.team.name}</small></div><strong>${value}</strong></div>`;
  }).join('');
}

function drawBriefing(data) {
  ui.briefingKicker.textContent = data.kicker;
  ui.briefingTitle.textContent = data.title;
  ui.briefingText.textContent = data.text;
  ui.objectives.innerHTML = data.objectives.map((item, index) => `<div class="objective"><i>${index + 1}</i><span>${item}</span></div>`).join('');
  showScreen('briefing');
  hud.classList.add('hidden');
  controls.classList.add('hidden');
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
      ? (result.position === 1 ? 'Pole position.' : 'Griglia definita.')
      : (result.advanced ? 'Passi alla sessione successiva.' : `Eliminato in ${result.session}.`);
    ui.resultText.innerHTML = `Tempo: <b>${formatTime(result.time)}</b><br>${outcome}`;
    ui.resultsTable.innerHTML = makeRows(result.results, game.player.driver.id, 'time');
  } else {
    ui.resultKicker.textContent = `${game.track.name.toUpperCase()} • GARA`;
    ui.resultTitle.textContent = `P${result.position}`;
    ui.resultText.innerHTML = `Tempo gara: <b>${formatTime(result.time)}</b><br>${result.position <= 3 ? 'Podio conquistato.' : 'Weekend completato.'}`;
    ui.resultsTable.innerHTML = makeRows(result.standings, game.player.driver.id, 'gap');
  }
  showScreen('result');
}

function showChampionship(entries) {
  const playerEntry = entries.find((entry) => entry.driver.id === game.player.driver.id);
  const position = entries.indexOf(playerEntry) + 1;
  ui.championTitle.textContent = position === 1 ? 'CAMPIONE!' : `P${position} FINALE`;
  ui.championText.textContent = position === 1
    ? 'Hai vinto il mini campionato.'
    : `Campionato concluso con ${playerEntry.points} punti.`;
  ui.championshipTable.innerHTML = makeRows(entries, game.player.driver.id, 'points');
  hud.classList.add('hidden');
  controls.classList.add('hidden');
  showScreen('finish');
}

function updateHUD(data) {
  ui.pos.textContent = `${data.position}/${data.totalCars}`;
  ui.session.textContent = data.session;
  ui.trackName.textContent = data.track.toUpperCase();
  ui.lapLabel.textContent = data.session === 'RACE' ? 'GIRO' : 'SESSIONE';
  ui.lap.textContent = `${data.lap}/${data.laps}`;
  ui.speed.textContent = data.speed;
  ui.ersPct.textContent = `${data.ers}%`;
  ui.ersFill.style.width = `${data.ers}%`;
  ui.raceMessage.textContent = data.message;
  speedLines.style.opacity = data.boostActive ? '.5' : data.speed > 290 ? '.12' : '0';
}

const game = new FormulaRushGame(canvas, {
  onBriefing: drawBriefing,
  onDriveStart: () => {
    hideOverlay();
    hud.classList.remove('hidden');
    controls.classList.remove('hidden');
  },
  onCountdown: (value) => {
    if (value > 0) {
      countdown.textContent = Math.ceil(value);
      countdown.style.color = '#ff4058';
      countdown.style.opacity = '1';
    } else if (value > -0.45) {
      countdown.textContent = 'VIA';
      countdown.style.color = '#64f1ff';
      countdown.style.opacity = String(Math.max(0, 1 + value * 2));
    } else {
      countdown.textContent = '';
    }
  },
  onHUD: updateHUD,
  onImpact: () => {
    canvas.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-6px,3px)' }, { transform: 'translate(5px,-2px)' }, { transform: 'translate(0,0)' }], { duration: 180 });
  },
  onSessionResult: showSessionResult,
  onChampionshipEnd: showChampionship,
});

game.selectTeam(ui.teamSelect.value);

ui.teamSelect.addEventListener('change', (event) => game.selectTeam(event.target.value));
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
    const element = document.documentElement;
    await (element.requestFullscreen?.() || element.webkitRequestFullscreen?.());
  } catch (_) {}
});

soundBtn.addEventListener('click', async () => {
  audioEnabled = !audioEnabled;
  await game.setAudioEnabled(audioEnabled);
  soundBtn.textContent = audioEnabled ? '🔊' : '🔇';
  soundBtn.setAttribute('aria-label', audioEnabled ? 'Disattiva audio' : 'Attiva audio');
});

function bindControl(element, key) {
  const down = (event) => {
    event.preventDefault();
    element.classList.add('active');
    game.setInput(key, true);
  };
  const up = (event) => {
    event.preventDefault();
    element.classList.remove('active');
    game.setInput(key, false);
  };
  element.addEventListener('pointerdown', down, { passive: false });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => element.addEventListener(type, up, { passive: false }));
}

document.querySelectorAll('[data-key]').forEach((element) => bindControl(element, element.dataset.key));
document.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false });
window.addEventListener('resize', () => game.resize(), { passive: true });
showScreen('home');
