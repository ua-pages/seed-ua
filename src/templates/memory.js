export function createMemory() {
  const KEY = 'seed:memory';
  const MAX = 100;

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

  function save(memories) {
    try {
      localStorage.setItem(KEY, JSON.stringify(memories));
    } catch {
      // localStorage unavailable
    }
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  return {
    remember({ type, title, detail = {} }) {
      if (!type || !title) return null;
      const memories = load();
      const entry = {
        id: generateId(),
        type,
        title,
        detail,
        createdAt: new Date().toISOString(),
      };
      memories.push(entry);
      if (memories.length > MAX) {
        memories.splice(0, memories.length - MAX);
      }
      save(memories);
      return entry;
    },
    all() { return load(); },
    latest() {
      const memories = load();
      return memories.length > 0 ? memories[memories.length - 1] : null;
    },
    first() {
      const memories = load();
      return memories.length > 0 ? memories[0] : null;
    },
    count() { return load().length; },
    clear() { save([]); },
  };
}
