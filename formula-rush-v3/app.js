const overlay = document.getElementById('overlay');

function showFatalError(error) {
  console.error(error);
  overlay?.classList.add('show');
  const active = document.querySelector('.screen.active') || document.getElementById('homeScreen');
  if (active) {
    active.innerHTML = `
      <div class="kicker">ERRORE DI CARICAMENTO</div>
      <h2>Il motore 3D non è partito</h2>
      <p>Controlla la connessione e ricarica la pagina in Safari. Dettaglio: <code>${String(error?.message || error)}</code></p>
      <button class="primary" onclick="location.reload()">RICARICA</button>
    `;
  }
}

async function loadBundle() {
  const chunkPaths = Array.from({ length: 6 }, (_, index) =>
    `./chunks/${String(index).padStart(2, '0')}.b64`
  );

  const chunks = await Promise.all(
    chunkPaths.map(async (path) => {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`${path}: HTTP ${response.status}`);
      }
      return (await response.text()).trim();
    })
  );

  const binary = atob(chunks.join(''));
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
}

loadBundle().catch(showFatalError);
