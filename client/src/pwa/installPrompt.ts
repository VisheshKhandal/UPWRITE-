/**
 * Best-effort PWA install state shared by every "Install app" control.
 *
 * `beforeinstallprompt` can fire before React renders the sidebar, so the listeners are
 * attached once from main.tsx and the deferred event is kept here. Components read the
 * state through `useInstallState` (useSyncExternalStore), which subscribes and
 * unsubscribes cleanly.
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
  interface Navigator {
    /** iOS Safari: true when launched from the Home Screen. */
    standalone?: boolean;
  }
}

/** Which install experience this browser can offer. */
export type InstallPlatform = "prompt" | "ios" | "macos-safari" | "chromium" | "other";

export interface InstallState {
  /** Running as an installed app window (best effort). */
  isStandalone: boolean;
  /** The browser confirmed installation during this page session (`appinstalled`). */
  installedThisSession: boolean;
  /** A deferred `beforeinstallprompt` is available to show from a click. */
  canPrompt: boolean;
  /** An accepted prompt is waiting for the browser to confirm with `appinstalled`. */
  awaitingInstall: boolean;
  platform: InstallPlatform;
}

export type InstallOutcome = "accepted" | "dismissed" | "unavailable" | "error";

const STANDALONE_QUERY = "(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui), (display-mode: window-controls-overlay)";

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installedThisSession = false;
let awaitingInstall = false;
let teardown: (() => void) | null = null;
const listeners = new Set<() => void>();

const detectStandalone = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia(STANDALONE_QUERY).matches || window.navigator.standalone === true;
};

const detectManualPlatform = (): Exclude<InstallPlatform, "prompt"> => {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  // iPadOS reports a desktop Mac UA, so also check for touch support.
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";
  const isMacSafari = /Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/.test(ua);
  if (isMacSafari) return "macos-safari";
  const isChromium = /Chrome|Chromium|Edg|OPR|Brave/i.test(ua);
  if (isChromium) return "chromium";
  return "other";
};

const computeState = (): InstallState => {
  const isStandalone = detectStandalone();
  return {
    isStandalone,
    installedThisSession,
    canPrompt: deferredPrompt !== null,
    awaitingInstall,
    platform: deferredPrompt ? "prompt" : detectManualPlatform()
  };
};

let snapshot: InstallState = computeState();

const emit = () => {
  const next = computeState();
  const changed = (Object.keys(next) as (keyof InstallState)[]).some((key) => next[key] !== snapshot[key]);
  if (!changed) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
};

export const subscribeInstallState = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getInstallState = () => snapshot;

/** Attach the global listeners once. Returns a teardown (used by HMR). */
export const initInstallPrompt = () => {
  if (typeof window === "undefined" || teardown) return teardown ?? (() => undefined);

  const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
    // Keep the browser's own mini-infobar from appearing; the sidebar button offers the
    // prompt instead, and only in response to a user click.
    event.preventDefault();
    deferredPrompt = event;
    emit();
  };

  const onAppInstalled = () => {
    deferredPrompt = null;
    awaitingInstall = false;
    installedThisSession = true;
    emit();
    window.dispatchEvent(new CustomEvent("upwrite:app-installed"));
  };

  const displayMode = window.matchMedia(STANDALONE_QUERY);
  const onDisplayModeChange = () => emit();

  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.addEventListener("appinstalled", onAppInstalled);
  displayMode.addEventListener("change", onDisplayModeChange);
  snapshot = computeState();

  teardown = () => {
    window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.removeEventListener("appinstalled", onAppInstalled);
    displayMode.removeEventListener("change", onDisplayModeChange);
    teardown = null;
  };
  return teardown;
};

/**
 * Show the browser's install prompt. Must be called from a user gesture.
 * The deferred event is single-use, so it is cleared before prompting.
 */
export const promptInstall = async (): Promise<InstallOutcome> => {
  const event = deferredPrompt;
  if (!event) return "unavailable";

  deferredPrompt = null;
  emit();

  try {
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === "accepted") {
      // Not installed yet: wait for the browser's `appinstalled` confirmation.
      awaitingInstall = !installedThisSession;
      emit();
    }
    return choice.outcome;
  } catch {
    return "error";
  }
};

if (import.meta.hot) {
  import.meta.hot.dispose(() => teardown?.());
}
