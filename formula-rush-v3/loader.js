const startButton = document.getElementById('startBtn');
const intro = document.querySelector('#homeScreen p');

async function loadGame() {
  if (startButton) {
    startButton.disabled = true;
    startButton.textContent = 'CARICAMENTO MOTORE 3D…';
  }

  const chunkNames = ['00', '01', '02', '03'];
  const chunks = await Promise.all(chunkNames.map(async (name) => {
    const response = await fetch(`./chunks/${name}.b64?build=4`);
    if (!response.ok) throw new Error(`Chunk ${name} non disponibile (${response.status})`);
    return response.text();
  }));

  const base64 = chunks.join('').replace(/\s+/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

  const moduleUrl = URL.createObjectURL(new Blob([bytes], { type: 'text/javascript' }));
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

loadGame().catch((error) => {
  console.error(error);
  if (startButton) {
    startButton.disabled = true;
    startButton.textContent = 'ERRORE DI CARICAMENTO';
  }
  if (intro) intro.textContent = `Il motore 3D non è stato caricato: ${error.message}. Ricarica la pagina in Safari.`;
});
