const KEYS = {
  identity: 'seed-demo:identity',
  life: 'seed-demo:life',
  memory: 'seed-demo:memory',
  legacy: 'seed-demo:legacy',
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

const life = read(KEYS.life, { awakenings: 0, state: 'awake' });
if (life.state !== 'dead') {
  life.awakenings += 1;
  life.state = 'awake';
  write(KEYS.life, life);
}

const sessionStart = Date.now();
function memories() { return read(KEYS.memory, []); }
function legacy() { return read(KEYS.legacy, null); }
function stage() {
  if (life.state === 'dead') return 'dead';
  if (life.awakenings >= 10 || memories().length >= 5) return 'grow';
  if (life.awakenings >= 2) return 'sprout';
  return 'seed';
}

function remember(title, type = 'moment') {
  if (life.state === 'dead') return null;
  if (!title?.trim()) throw new Error('A memory title is required.');
  const list = memories();
  const entry = { id: crypto.randomUUID(), type, title: title.trim(), createdAt: new Date().toISOString() };
  list.push(entry);
  write(KEYS.memory, list.slice(-100));
  window.dispatchEvent(new CustomEvent('seed:remember', { detail: entry }));
  render();
  return entry;
}

function sleep() {
  if (life.state === 'dead') return snapshot();
  life.state = 'sleeping';
  write(KEYS.life, life);
  window.dispatchEvent(new CustomEvent('seed:sleep'));
  render();
  return snapshot();
}

function wake() {
  if (life.state === 'dead') return snapshot();
  if (life.state !== 'awake') life.awakenings += 1;
  life.state = 'awake';
  write(KEYS.life, life);
  window.dispatchEvent(new CustomEvent('seed:awake'));
  render();
  return snapshot();
}

function die(reason, note = '') {
  if (life.state === 'dead') return legacy();
  if (!reason?.trim()) throw new Error('A reason is required.');
  life.state = 'dead';
  life.diedAt = new Date().toISOString();
  life.reason = reason.trim();
  life.note = note.trim();
  write(KEYS.life, life);
  const record = {
    schema: 'seed/legacy/v1',
    name: identity.name,
    species: identity.species,
    bornAt: identity.plantedAt,
    diedAt: life.diedAt,
    reason: life.reason,
    note: life.note,
    awakenings: life.awakenings,
    memories: memories().length,
  };
  write(KEYS.legacy, record);
  window.dispatchEvent(new CustomEvent('seed:dead', { detail: record }));
  renderMemorial(record);
  return record;
}

function snapshot() {
  return {
    identity,
    life: {
      awakenings: life.awakenings,
      runtimeAge: Date.now() - sessionStart,
      totalAge: Date.now() - new Date(identity.plantedAt).getTime(),
      state: life.state,
      heartbeat: life.state === 'awake' ? 'healthy' : 'stopped',
      diedAt: life.diedAt ?? null,
    },
    memory: memories().length,
    stage: stage(),
    legacy: legacy(),
  };
}

function formatAge(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'long' }).format(new Date(value));
}

function render() {
  if (life.state === 'dead') return renderMemorial(legacy());
  const memory = memories();
  const currentStage = stage();
  const labels = { seed: 'насінина', sprout: 'паросток', grow: 'ріст' };
  document.body.dataset.stage = currentStage;
  document.body.dataset.lifeState = life.state;
  $('#stage-label').textContent = `стадія: ${labels[currentStage]}`;
  $('#planted-at').textContent = formatDate(identity.plantedAt);
  $('#awakenings').textContent = life.awakenings;
  $('#memory-count').textContent = memory.length;
  $('#life-state').textContent = life.state;
  $('.heartbeat small').textContent = life.state === 'awake' ? 'heartbeat healthy' : 'heartbeat stopped';
  $('#memory-empty').hidden = memory.length > 0;
  $('#memory-list').innerHTML = memory.slice(-4).reverse().map(item => `
    <li><time>${new Date(item.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</time><span>${escapeHtml(item.title)}</span></li>
  `).join('');
}

function renderMemorial(record) {
  if (!record) return;
  $('#application').hidden = true;
  $('#memorial').hidden = false;
  $('#memorial-title').textContent = record.name;
  $('#memorial-life').textContent = `Жив із ${formatDate(record.bornAt)} до ${formatDate(record.diedAt)}`;
  $('#memorial-reason').textContent = record.reason;
  $('#memorial-note').textContent = record.note;
  $('#memorial-note-label').hidden = !record.note;
  $('#memorial-note').hidden = !record.note;
  document.body.dataset.lifeState = 'dead';
}

function escapeHtml(value) {
  const node = document.createElement('span');
  node.textContent = value;
  return node.innerHTML;
}

const help = {
  'seed.help()': 'Список команд',
  'seed.status()': 'Поточний стан',
  "seed.remember('подія')": 'Зберегти спогад',
  'seed.sleep()': 'Приспати runtime',
  'seed.wake()': 'Пробудити runtime',
  "seed.die('причина', 'запис')": 'Завершити локальне життя',
  'seed.legacy': 'Фінальний запис',
};

function printConsole(value, kind = '') {
  const line = document.createElement('div');
  line.className = `console-line ${kind}`.trim();
  if (typeof value === 'string') {
    line.textContent = value;
  } else {
    line.textContent = JSON.stringify(value, null, 2);
  }
  $('#console-output').append(line);
  $('#console-output').scrollTop = $('#console-output').scrollHeight;
}

function runConsoleCommand(source) {
  const command = source.trim();
  const simple = command.match(/^seed\.(help|status|sleep|wake|snapshot)\(\)$/);
  if (simple) return window.seed[simple[1]]();
  if (command === 'seed.legacy') return window.seed.legacy;

  const rememberCommand = command.match(/^seed\.remember\(\s*(['"])(.*?)\1\s*\)$/);
  if (rememberCommand) return window.seed.remember(rememberCommand[2]);

  const dieCommand = command.match(/^seed\.die\(\s*(['"])(.*?)\1(?:\s*,\s*(['"])(.*?)\3)?\s*\)$/);
  if (dieCommand) return window.seed.die(dieCommand[2], dieCommand[4] ?? '');

  throw new Error("Невідома команда. Спробуйте seed.help().");
}

window.seed = {
  identity,
  life: {
    get awakenings() { return life.awakenings; },
    get runtimeAge() { return Date.now() - sessionStart; },
    get state() { return life.state; },
    get heartbeat() { return life.state === 'awake' ? 'healthy' : 'stopped'; },
  },
  memory: { remember: ({ title, type }) => remember(title, type), all: memories, count: () => memories().length },
  help() { console.table(help); return help; },
  status() { const value = snapshot(); console.log(`🌱 ${identity.name} · ${life.state}`); console.table(value.life); return value; },
  remember,
  sleep,
  wake,
  die,
  get legacy() { return legacy(); },
  get stage() { return stage(); },
  snapshot,
};

$('#memory-form').addEventListener('submit', event => {
  event.preventDefault();
  remember($('#memory-input').value);
  $('#memory-input').value = '';
});
function submitConsoleCommand() {
  const input = $('#console-input');
  const command = input.value.trim();
  if (!command) return false;
  printConsole(command, 'command');
  input.value = '';
  try {
    const result = runConsoleCommand(command);
    printConsole(result ?? 'null', result == null ? 'muted' : '');
  } catch (error) {
    printConsole(error.message, 'error');
  }
  return false;
}

$('#console-form').addEventListener('submit', event => {
  event.preventDefault();
  submitConsoleCommand();
});
$('#console-input').addEventListener('keydown', event => {
  if (event.key !== 'Enter' || event.isComposing) return;
  event.preventDefault();
  submitConsoleCommand();
});
$('#clear-memory').addEventListener('click', () => { write(KEYS.memory, []); render(); });
$('#seed').addEventListener('click', () => remember('Дотик до насінини', 'interaction'));
$('#copy-command').addEventListener('click', async event => {
  await navigator.clipboard.writeText('seed ~/мій-проєкт');
  event.currentTarget.textContent = 'скопійовано';
  setTimeout(() => { event.currentTarget.textContent = 'копіювати'; }, 1400);
});
$('#open-death').addEventListener('click', () => $('#death-dialog').showModal());
$('#close-death').addEventListener('click', () => $('#death-dialog').close());
$('#death-form').addEventListener('submit', event => {
  event.preventDefault();
  $('#death-dialog').close();
  die($('#death-reason').value, $('#death-note').value);
});
$('#new-life').addEventListener('click', () => {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
  location.reload();
});

document.addEventListener('visibilitychange', () => {
  if (life.state === 'dead') return;
  document.hidden ? sleep() : wake();
});
setInterval(() => {
  if (life.state !== 'dead' && $('#age')) $('#age').textContent = formatAge(Date.now() - sessionStart);
}, 1000);

render();
if (life.state !== 'dead') remember('Seed прокинувся', 'lifecycle');
console.info('🌱 Seed is alive. Try seed.help().');
