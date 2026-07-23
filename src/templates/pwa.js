export function createPWA({ name } = {}) {
  let installPrompt = null;

  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      installPrompt = e;
      window.dispatchEvent(new CustomEvent('seed:pwa:caninstall'));
    });

    window.addEventListener('appinstalled', () => {
      installPrompt = null;
      window.dispatchEvent(new CustomEvent('seed:pwa:installed'));
    });

    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  return {
    get canInstall() {
      return installPrompt !== null;
    },
    get isInstalled() {
      return window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches;
    },
    get isReady() {
      return 'serviceWorker' in navigator && 'PushManager' in window;
    },
    async install() {
      if (!installPrompt) return false;
      const result = await installPrompt.prompt();
      installPrompt = null;
      return result.outcome === 'accepted';
    },
    status() {
      return {
        canInstall: this.canInstall,
        isInstalled: this.isInstalled,
        isReady: this.isReady,
        displayMode: window.matchMedia('(display-mode: standalone)').matches
          ? 'standalone'
          : 'browser',
      };
    },
  };
}
