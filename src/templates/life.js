export function createLife(identity) {
  const STORAGE_KEY = 'seed:life';
  const plantedAt = identity.plantedAt;

  function load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return { awakenings: 0 };
      const parsed = JSON.parse(data);
      return { awakenings: typeof parsed.awakenings === 'number' ? parsed.awakenings : 0 };
    } catch {
      return { awakenings: 0 };
    }
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ awakenings: data.awakenings }));
    } catch {
      // localStorage unavailable
    }
  }

  const state = load();
  let awakeState = 'awake';
  let sessionStart = Date.now();
  let sleepStart = null;
  let totalSleepMs = 0;
  let beatInterval = null;
  let awakeCallbacks = [];
  let sleepCallbacks = [];

  state.awakenings += 1;
  save(state);

  function getRuntimeAge() {
    return Date.now() - sessionStart - totalSleepMs;
  }

  function getTotalAge() {
    return Date.now() - new Date(plantedAt).getTime();
  }

  function startHeartbeat() {
    if (beatInterval) return;
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
    if (awakeState === 'sleeping') return;
    awakeState = 'sleeping';
    sleepStart = Date.now();
    stopHeartbeat();
    sleepCallbacks.forEach(cb => cb());
  }

  function wakeUp() {
    if (awakeState === 'awake') return;
    awakeState = 'awake';
    if (sleepStart !== null) {
      totalSleepMs += Date.now() - sleepStart;
      sleepStart = null;
    }
    state.awakenings += 1;
    save(state);
    startHeartbeat();
    awakeCallbacks.forEach(cb => cb());
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

  startHeartbeat();

  return {
    get awakenings() { return state.awakenings; },
    get runtimeAge() { return getRuntimeAge(); },
    get totalAge() { return getTotalAge(); },
    get state() { return awakeState; },
    get heartbeat() { return beatInterval ? 'healthy' : 'stopped'; },
    onAwake(cb) { awakeCallbacks.push(cb); },
    onSleep(cb) { sleepCallbacks.push(cb); },
  };
}
