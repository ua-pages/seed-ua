import { createLife } from './life.js';
import { createMemory } from './memory.js';

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
      },
      memory: memory.count(),
      components: components.count(),
      stage: this.stage,
    };
  },
};

window.seed = seed;
