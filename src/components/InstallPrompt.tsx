import { useEffect, useState } from 'react';
import './InstallPrompt.css';

/**
 * The `beforeinstallprompt` event isn't in the standard TS lib.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type Platform = 'android' | 'ios' | 'huawei' | 'other';

const DISMISS_KEY = 'tashair_install_dismissed_at';
/** Re-show the prompt after this many days if previously dismissed. */
const DISMISS_DAYS = 14;

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();

  // iOS: iPhone/iPad/iPod, or iPadOS reporting as Mac with touch.
  const isIOS =
    /iphone|ipad|ipod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';

  // Huawei devices (no Google Play Services -> no beforeinstallprompt).
  if (/huawei|honor|hmscore|harmonyos/.test(ua)) return 'huawei';

  if (/android/.test(ua)) return 'android';

  return 'other';
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari uses a non-standard navigator flag.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function wasRecentlyDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (!Number.isFinite(dismissedAt)) return false;
  const ageMs = Date.now() - dismissedAt;
  return ageMs < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Prompts users to install the Tas Hair PWA.
 * - Android/Chrome: uses the native beforeinstallprompt flow via a branded banner.
 * - iOS Safari: shows a visual "Add to Home Screen" guide (no install API exists).
 * - Huawei: shows a guide for adding via the browser menu.
 */
export default function InstallPrompt() {
  const [platform] = useState<Platform>(detectPlatform);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // Already installed.
    if (wasRecentlyDismissed()) return;

    // Android / Chromium: capture the install event and show our own banner.
    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Hide everything once installed.
    function handleInstalled() {
      setShowBanner(false);
      setShowGuide(false);
      setDeferredPrompt(null);
    }
    window.addEventListener('appinstalled', handleInstalled);

    // iOS/Huawei never fire beforeinstallprompt, so surface a manual banner
    // after a short delay to avoid competing with first paint.
    let timer: number | undefined;
    if (platform === 'ios' || platform === 'huawei') {
      timer = window.setTimeout(() => setShowBanner(true), 2500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
      if (timer) window.clearTimeout(timer);
    };
  }, [platform]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShowBanner(false);
    setShowGuide(false);
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      // Native Android/Chrome install flow.
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
      } else {
        dismiss();
      }
      setDeferredPrompt(null);
      return;
    }
    // iOS / Huawei: open the visual guide.
    setShowGuide(true);
  }

  if (!showBanner && !showGuide) return null;

  return (
    <>
      {showBanner && (
        <div className="install-banner" role="dialog" aria-label="Install Tas Hair app">
          <div className="install-banner__icon">
            <img src="/logo-192.png" alt="" width={44} height={44} />
          </div>
          <div className="install-banner__text">
            <strong>Install Tas Hair</strong>
            <span>Add the app to your home screen for quick booking.</span>
          </div>
          <div className="install-banner__actions">
            <button type="button" className="install-banner__install" onClick={handleInstallClick}>
              Install
            </button>
            <button
              type="button"
              className="install-banner__close"
              onClick={dismiss}
              aria-label="Dismiss install prompt"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {showGuide && (
        <div className="install-guide" role="dialog" aria-modal="true" aria-label="How to install">
          <div className="install-guide__backdrop" onClick={() => setShowGuide(false)} />
          <div className="install-guide__sheet">
            <div className="install-guide__header">
              <img src="/logo-192.png" alt="" width={48} height={48} />
              <h2>Add Tas Hair to your home screen</h2>
              <button
                type="button"
                className="install-guide__x"
                onClick={() => setShowGuide(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {platform === 'ios' ? (
              <ol className="install-guide__steps">
                <li>
                  <span className="install-guide__step-num">1</span>
                  <span>
                    Tap the <strong>Share</strong> button
                    <ShareIcon /> in the Safari toolbar.
                  </span>
                </li>
                <li>
                  <span className="install-guide__step-num">2</span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>
                    <PlusSquareIcon />.
                  </span>
                </li>
                <li>
                  <span className="install-guide__step-num">3</span>
                  <span>
                    Tap <strong>Add</strong> in the top-right corner. Tas Hair now lives on your
                    home screen.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="install-guide__steps">
                <li>
                  <span className="install-guide__step-num">1</span>
                  <span>
                    Open the browser <strong>menu</strong> (the <strong>&#8942;</strong> or
                    <strong> &#9776;</strong> icon).
                  </span>
                </li>
                <li>
                  <span className="install-guide__step-num">2</span>
                  <span>
                    Tap <strong>Add to home screen</strong> (or <strong>Install app</strong>).
                  </span>
                </li>
                <li>
                  <span className="install-guide__step-num">3</span>
                  <span>
                    Confirm by tapping <strong>Add</strong>. Tas Hair now lives on your home
                    screen.
                  </span>
                </li>
              </ol>
            )}

            <button type="button" className="install-guide__done" onClick={dismiss}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ShareIcon() {
  return (
    <svg className="install-guide__inline-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="none"
        stroke="#7B2D8B"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v12M8 7l4-4 4 4M6 12v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7"
      />
    </svg>
  );
}

function PlusSquareIcon() {
  return (
    <svg className="install-guide__inline-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="#7B2D8B" strokeWidth="1.8" />
      <path stroke="#7B2D8B" strokeWidth="1.8" strokeLinecap="round" d="M12 8v8M8 12h8" />
    </svg>
  );
}
