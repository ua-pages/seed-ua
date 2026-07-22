function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(value) {
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function formatLifespan(bornAt, diedAt) {
  const days = Math.max(0, Math.floor((new Date(diedAt) - new Date(bornAt)) / 86_400_000));
  if (days < 1) return 'менше одного дня';
  if (days === 1) return '1 день';
  return `${days} днів`;
}

export function createLegacy(manifest, { reason, note = '', diedAt = new Date().toISOString() }) {
  return {
    schema: 'seed/legacy/v1',
    name: manifest.name,
    species: manifest.species,
    bornAt: manifest.plantedAt,
    diedAt,
    reason,
    note,
  };
}

export function renderMemorial(legacy) {
  const name = escapeHtml(legacy.name);
  const reason = escapeHtml(legacy.reason);
  const note = escapeHtml(legacy.note);
  const born = escapeHtml(formatDate(legacy.bornAt));
  const died = escapeHtml(formatDate(legacy.diedAt));
  const lifespan = escapeHtml(formatLifespan(legacy.bornAt, legacy.diedAt));

  return `<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#090d0b">
  <title>${name} — меморіал</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 24px; color: #e8f1eb; background: #090d0b; }
    main { width: min(620px, 100%); text-align: center; }
    .seed { display: block; margin-bottom: 34px; filter: grayscale(1); opacity: .55; font-size: 48px; }
    .state { color: #78847c; font: 12px ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 18px 0 12px; font: 400 clamp(42px, 9vw, 72px) Georgia, serif; letter-spacing: -.04em; }
    .life { margin: 0 0 42px; color: #93a097; }
    article { padding: 28px; border: 1px solid #222d26; border-radius: 16px; background: #0d1310; text-align: left; }
    dt { margin-top: 18px; color: #718077; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
    dt:first-child { margin-top: 0; }
    dd { margin: 7px 0 0; line-height: 1.6; }
    footer { margin-top: 36px; color: #657168; font: 12px ui-monospace, monospace; }
  </style>
</head>
<body>
  <main>
    <span class="seed" aria-hidden="true">🌱</span>
    <span class="state">heartbeat stopped</span>
    <h1>${name}</h1>
    <p class="life">Жив із ${born} до ${died} · ${lifespan}</p>
    <article>
      <dl>
        <dt>Причина завершення</dt>
        <dd>${reason}</dd>
        ${note ? `<dt>Останній запис</dt>\n        <dd>${note}</dd>` : ''}
      </dl>
    </article>
    <footer>Пам’ять збережено Seed.</footer>
  </main>
</body>
</html>
`;
}
