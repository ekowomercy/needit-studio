'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'needit.pwa.install.dismissed';

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(DISMISS_KEY) === '1') {
      setDismissed(true);
      return;
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (dismissed || !deferred) return null;

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const close = () => {
    window.localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="install-banner" role="dialog" aria-label="Install NeedIt Studio">
      <div className="install-banner__content">
        <span className="install-banner__text">
          Install NeedIt Studio for quick access and a full-screen experience.
        </span>
        <div className="install-banner__actions">
          <button type="button" className="btn btn-ghost" onClick={close}>
            Not now
          </button>
          <button type="button" className="btn btn-primary" onClick={install}>
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
