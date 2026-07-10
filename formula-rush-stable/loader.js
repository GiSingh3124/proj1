const startButton = document.getElementById('startBtn');
const intro = document.querySelector('#homeScreen p');

function showFailure(error) {
  console.error(error);
  if (startButton) {
    startButton.disabled = false;
    startButton.textContent = 'RICARICA IL GIOCO';
    startButton.onclick = () => window.location.reload();
  }
  if (intro) {
    intro.textContent = `Errore di caricamento: ${error.message}. Tocca “Ricarica il gioco”.`;
  }
}

async function loadGame() {
  if (startButton) {
    startButton.disabled = true;
    startButton.textContent = 'CARICAMENTO MOTORE 3D…';
  }

  const names = ['00', '01', '02', '03', '04', '05'];
  const parts = await Promise.all(names.map(async (name) => {
    const response = await fetch(`./parts/${name}.js.part?build=stable-1`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`parte ${name}: HTTP ${response.status}`);
    return response.text();
  }));

  const source = parts.join('');
  if (source.length !== 30276) {
    throw new Error(`bundle incompleto (${source.length}/30276 byte)`);
  }
  if (!source.includes('window.__FORMULA_RUSH__')) {
    throw new Error('hook di avvio assente');
  }

  const script = document.createElement('script');
  script.type = 'module';
  script.textContent = `${source}\n//# sourceURL=formula-rush-stable-app.js`;
  const moduleError = new Promise((_, reject) => {
    script.addEventListener('error', () => reject(new Error('errore JavaScript nel motore')), { once: true });
  });
  document.head.appendChild(script);

  const ready = (async () => {
    const deadline = Date.now() + 25000;
    while (!window.__FORMULA_RUSH__ && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (!window.__FORMULA_RUSH__) throw new Error('timeout avvio motore');
  })();

  await Promise.race([ready, moduleError]);

  if (startButton) {
    startButton.disabled = false;
    startButton.textContent = 'INIZIA IL CAMPIONATO';
  }
}

loadGame().catch(showFailure);
