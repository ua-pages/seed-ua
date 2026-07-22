const KEYS = {
  identity: 'seed-demo:identity',
  life: 'seed-demo:life',
  memory: 'seed-demo:memory',
  components: 'seed-demo:components',
};

const $ = selector => document.querySelector(selector);
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* localStorage may be unavailable */ }
};

const identity = read(KEYS.identity, {
  name: 'seed-demo',
  species: 'application',
  environment: 'browser',
  plantedAt: new Date().toISOString(),
});
write(KEYS.identity, identity);

const life = read(KEYS.life, { awakenings: 0 });
life.awakenings += 1;
write(KEYS.life, life);

const sessionStart = Date.now();
const componentNames = ['shell', 'memory', 'heartbeat', 'roots', 'observer'];

function memories() { return read(KEYS.memory, []); }
function components() { return read(KEYS.components, []); }
function stage() {
  if (life.awakenings >= 10 || components().length >= 5) return 'grow';
  if (life.awakenings >= 2 || components().length >= 1) return 'sprout';
  return 'seed';
}

function remember(title, type = 'moment') {
  const list = memories();
  const entry = { id: crypto.randomUUID(), type, title, createdAt: new Date().toISOString() };
  list.push(entry);
  write(KEYS.memory, list.slice(-100));
  window.dispatchEvent(new CustomEvent('seed:remember', { detail: entry }));
  render();
  return entry;
}

function born() {
  const list = components();
  const name = componentNames.find(candidate => !list.some(item => item.name === candidate));
  if (!name) return;
  const entry = { name, createdAt: new Date().toISOString() };
  list.push(entry);
  write(KEYS.components, list);
  window.dispatchEvent(new CustomEvent('seed:born', { detail: entry }));
  remember(`Народився компонент ${name}`, 'component');
}

function formatAge(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function render() {
  const memory = memories();
  const componentList = components();
  const currentStage = stage();
  const labels = { seed: 'насінина', sprout: 'паросток', grow: 'ріст' };

  document.body.dataset.stage = currentStage;
  $('#stage-label').textContent = `стадія: ${labels[currentStage]}`;
  $('#planted-at').textContent = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium' }).format(new Date(identity.plantedAt));
  $('#awakenings').textContent = life.awakenings;
  $('#memory-count').textContent = memory.length;
  $('#component-count').textContent = componentList.length;
  $('#memory-empty').hidden = memory.length > 0;
  $('#memory-list').innerHTML = memory.slice(-4).reverse().map(item => `
    <li><time>${new Date(item.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</time><span>${escapeHtml(item.title)}</span></li>
  `).join('');
  $('#component-list').innerHTML = componentList.length
    ? componentList.map(item => `<span>&lt;${escapeHtml(item.name)}&gt;</span>`).join('')
    : '<span>ще ніхто не народився</span>';
  $('#birth-component').disabled = componentList.length >= componentNames.length;
  $('#birth-component').textContent = componentList.length >= componentNames.length ? 'усі компоненти народжені' : '+ народити компонент';
}

function escapeHtml(value) {
  const node = document.createElement('span');
  node.textContent = value;
  return node.innerHTML;
}

$('#memory-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = $('#memory-input');
  remember(input.value.trim());
  input.value = '';
});

$('#clear-memory').addEventListener('click', () => { write(KEYS.memory, []); render(); });
$('#birth-component').addEventListener('click', born);
$('#seed').addEventListener('click', () => remember('Дотик до насінини', 'interaction'));
$('#copy-command').addEventListener('click', async event => {
  await navigator.clipboard.writeText('seed ~/мій-проєкт');
  event.currentTarget.textContent = 'скопійовано';
  setTimeout(() => { event.currentTarget.textContent = 'копіювати'; }, 1400);
});

window.seed = {
  identity,
  life: {
    get awakenings() { return life.awakenings; },
    get runtimeAge() { return Date.now() - sessionStart; },
    get state() { return document.hidden ? 'sleeping' : 'awake'; },
    get heartbeat() { return document.hidden ? 'stopped' : 'healthy'; },
  },
  memory: { remember: ({ title, type }) => remember(title, type), all: memories, count: () => memories().length, clear: () => { write(KEYS.memory, []); render(); } },
  components: { born, all: components, count: () => components().length },
  get stage() { return stage(); },
  snapshot() { return { identity, life: this.life, memory: memories().length, components: components().length, stage: stage() }; },
};

document.addEventListener('visibilitychange', () => window.dispatchEvent(new CustomEvent(document.hidden ? 'seed:sleep' : 'seed:awake')));
setInterval(() => { $('#age').textContent = formatAge(Date.now() - sessionStart); }, 1000);
render();
remember('Seed прокинувся', 'lifecycle');
