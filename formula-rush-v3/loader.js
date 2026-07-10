const startButton = document.getElementById('startBtn');
const intro = document.querySelector('#homeScreen p');

function showLoadFailure(error) {
  console.error(error);
  if (startButton) {
    startButton.disabled = false;
    startButton.textContent = 'RICARICA IL GIOCO';
    startButton.onclick = () => location.reload();
  }
  if (intro) {
    intro.textContent = `Il motore 3D non è stato caricato: ${error.message}. Tocca “Ricarica il gioco” in Safari.`;
  }
}

async function loadGame() {
  if (startButton) {
    startButton.disabled = true;
    startButton.textContent = 'CARICAMENTO MOTORE 3D…';
  }

  const chunkNames = ['00', '01', '02', '03', '04', '05'];
  const chunks = await Promise.all(chunkNames.map(async (name) => {
    const response = await fetch(`./chunks/${name}.b64?build=5`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`chunk ${name}: HTTP ${response.status}`);
    }
    return response.text();
  }));

  const base64 = chunks.join('').replace(/\s+/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const moduleUrl = URL.createObjectURL(
    new Blob([bytes], { type: 'text/javascript' })
  );

  try {
    await import(moduleUrl);
  } finally {
    URL.revokeObjectURL(moduleUrl);
  }

  if (startButton) {
    startButton.disabled = false;
    startButton.textContent = 'INIZIA IL CAMPIONATO';
  }
}

loadGame().catch(showLoadFailure);
