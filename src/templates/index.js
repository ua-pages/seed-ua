import { createLife } from './life.js';
import { createMemory } from './memory.js';
__PWA_IMPORT__

const IDENTITY = JSON.parse('__IDENTITY_JSON__');

function createComponents() {
  const KEY = 'seed:components';

  function load() {
    try {
      const data = localStorage.getItem(KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function save(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
      // localStorage unavailable
    }
  }

  return {
    born(name) {
      if (!name) return null;
      const list = load();
      if (list.some(c => c.name === name)) return null;
      const entry = { name, createdAt: new Date().toISOString() };
      list.push(entry);
      save(list);
      window.dispatchEvent(new CustomEvent('seed:born', { detail: entry }));
      return entry;
    },
    all() { return load(); },
    has(name) { return load().some(c => c.name === name); },
    count() { return load().length; },
  };
}

function calculateStage(life, components) {
  if (life.awakenings >= 10 || components.count() >= 5) return 'grow';
  if (life.awakenings >= 1) return 'sprout';
  return 'seed';
}

const life = createLife(IDENTITY);
const memory = createMemory();
const components = createComponents();
__PWA_INIT__

life.onAwake(() => {
  window.dispatchEvent(new CustomEvent('seed:awake', {
    detail: { awakenings: life.awakenings },
  }));
});

life.onSleep(() => {
  window.dispatchEvent(new CustomEvent('seed:sleep', {
    detail: { state: 'sleeping' },
  }));
});

const origRemember = memory.remember;
memory.remember = function (...args) {
  const result = origRemember.apply(memory, args);
  if (result) {
    window.dispatchEvent(new CustomEvent('seed:remember', { detail: result }));
  }
  return result;
};

const seed = {
  identity: {
    name: IDENTITY.name,
    species: IDENTITY.species,
    environment: IDENTITY.environment,
    plantedAt: IDENTITY.plantedAt,
  },
  life,
  memory,
  components,
  pwa,
  help() {
    const commands = {
      'seed.help()': 'List commands',
      'seed.status()': 'Show current state',
      "seed.remember('title')": 'Save a memory',
      'seed.sleep()': 'Put runtime to sleep',
      'seed.wake()': 'Awaken runtime',
      "seed.die('reason', 'note')": 'End local runtime life',
      'seed.legacy': 'Read the final local record',
      'seed.pwa.install()': 'Install as PWA',
      'seed.pwa.status()': 'Check PWA status',
    };
    console.table(commands);
    return commands;
  },
  status() {
    const snapshot = this.snapshot();
    console.log(`🌱 ${snapshot.identity.name} · ${snapshot.life.state}`);
    console.table(snapshot.life);
    return snapshot;
  },
  remember(title, type = 'note') {
    if (!title?.trim()) throw new Error('A memory title is required.');
    return memory.remember({ type, title: title.trim() });
  },
  sleep() {
    life.sleep();
    return this.snapshot();
  },
  wake() {
    life.wake();
    return this.snapshot();
  },
  die(reason, note = '') {
    return life.die({ reason, note });
  },
  get legacy() {
    try {
      const value = localStorage.getItem('seed:legacy');
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },
  get stage() {
    return calculateStage(life, components);
  },
  snapshot() {
    return {
      identity: this.identity,
      life: {
        awakenings: life.awakenings,
        runtimeAge: life.runtimeAge,
        totalAge: life.totalAge,
        state: life.state,
        heartbeat: life.heartbeat,
        diedAt: life.diedAt,
      },
      memory: memory.count(),
      components: components.count(),
      stage: this.stage,
      legacy: this.legacy,
      pwa: pwa ? {
        canInstall: pwa.canInstall,
        isInstalled: pwa.isInstalled,
        isReady: pwa.isReady,
      } : null,
    };
  },
};

window.seed = seed;
console.info('🌱 Seed is alive. Try seed.help().');
