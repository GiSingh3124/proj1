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

function decodeBundle(chunks) {
  // Safari's atob() rejects control separators sometimes inserted by raw-file
  // proxies into very long one-line files. Keep only the Base64 alphabet.
  let base64 = chunks.join('').replace(/[^A-Za-z0-9+/=]/g, '');

  // Padding may only appear at the end. Rebuild it deterministically.
  base64 = base64.replace(/=/g, '');
  const remainder = base64.length % 4;
  if (remainder === 1) throw new Error('bundle Base64 incompleto');
  if (remainder > 0) base64 += '='.repeat(4 - remainder);

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function loadGame() {
  if (startButton) {
    startButton.disabled = true;
    startButton.textContent = 'CARICAMENTO MOTORE 3D…';
  }

  const chunkNames = ['00', '01', '02', '03', '04', '05'];
  const chunks = await Promise.all(chunkNames.map(async (name) => {
    const response = await fetch(`./chunks/${name}.b64?build=6`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`chunk ${name}: HTTP ${response.status}`);
    }
    return response.text();
  }));

  const bytes = decodeBundle(chunks);
  const moduleUrl = URL.createObjectURL(
    new Blob([bytes], { type: 'text/javascript;charset=utf-8' })
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
