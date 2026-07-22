export function createLife(identity) {
  const STORAGE_KEY = 'seed:life';
  const plantedAt = identity.plantedAt;

  function load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return { awakenings: 0, state: 'awake' };
      const parsed = JSON.parse(data);
      return {
        awakenings: typeof parsed.awakenings === 'number' ? parsed.awakenings : 0,
        state: parsed.state === 'dead' ? 'dead' : 'awake',
        diedAt: parsed.diedAt || null,
        reason: parsed.reason || null,
        note: parsed.note || '',
      };
    } catch {
      return { awakenings: 0, state: 'awake' };
    }
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage unavailable
    }
  }

  const state = load();
  let awakeState = state.state;
  let sessionStart = Date.now();
  let sleepStart = null;
  let totalSleepMs = 0;
  let beatInterval = null;
  let awakeCallbacks = [];
  let sleepCallbacks = [];

  if (awakeState !== 'dead') state.awakenings += 1;
  save(state);

  function getRuntimeAge() {
    return Date.now() - sessionStart - totalSleepMs;
  }

  function getTotalAge() {
    return Date.now() - new Date(plantedAt).getTime();
  }

  function startHeartbeat() {
    if (beatInterval || awakeState === 'dead') return;
    beatInterval = setInterval(() => {
      window.dispatchEvent(new CustomEvent('seed:heartbeat', {
        detail: {
          runtimeAge: getRuntimeAge(),
          totalAge: getTotalAge(),
          state: awakeState,
          awakenings: state.awakenings,
          timestamp: new Date().toISOString(),
        },
      }));
    }, 30000);
  }

  function stopHeartbeat() {
    if (beatInterval) {
      clearInterval(beatInterval);
      beatInterval = null;
    }
  }

  function goToSleep() {
    if (awakeState === 'sleeping' || awakeState === 'dead') return;
    awakeState = 'sleeping';
    sleepStart = Date.now();
    stopHeartbeat();
    sleepCallbacks.forEach(cb => cb());
  }

  function wakeUp() {
    if (awakeState === 'awake' || awakeState === 'dead') return;
    awakeState = 'awake';
    if (sleepStart !== null) {
      totalSleepMs += Date.now() - sleepStart;
      sleepStart = null;
    }
    state.awakenings += 1;
    state.state = 'awake';
    save(state);
    startHeartbeat();
    awakeCallbacks.forEach(cb => cb());
  }

  function die({ reason, note = '' } = {}) {
    if (awakeState === 'dead') return null;
    if (!reason?.trim()) throw new Error('A reason is required.');
    stopHeartbeat();
    awakeState = 'dead';
    state.state = 'dead';
    state.diedAt = new Date().toISOString();
    state.reason = reason.trim();
    state.note = note.trim();
    save(state);
    const legacy = {
      schema: 'seed/legacy/v1',
      name: identity.name,
      species: identity.species,
      bornAt: plantedAt,
      diedAt: state.diedAt,
      reason: state.reason,
      note: state.note,
      awakenings: state.awakenings,
    };
    try { localStorage.setItem('seed:legacy', JSON.stringify(legacy)); } catch { /* unavailable */ }
    window.dispatchEvent(new CustomEvent('seed:dead', { detail: legacy }));
    return legacy;
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        goToSleep();
      } else {
        wakeUp();
      }
    });
  }

  if (awakeState !== 'dead') startHeartbeat();

  return {
    get awakenings() { return state.awakenings; },
    get runtimeAge() { return getRuntimeAge(); },
    get totalAge() { return getTotalAge(); },
    get state() { return awakeState; },
    get heartbeat() { return beatInterval ? 'healthy' : 'stopped'; },
    get diedAt() { return state.diedAt; },
    get reason() { return state.reason; },
    sleep: goToSleep,
    wake: wakeUp,
    die,
    onAwake(cb) { awakeCallbacks.push(cb); },
    onSleep(cb) { sleepCallbacks.push(cb); },
  };
}
