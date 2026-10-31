import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, WifiOff, Wifi } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useAppDispatch } from "../app/hooks";
import { pushToast } from "../features/ui/uiSlice";
import { MOTION_EASE, useReducedMotionPreference } from "../motion/system";
import { useOnlineStatus } from "./hooks";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Service-worker lifecycle UI:
 * - asks before activating a new version (never auto-reloads over unsaved work),
 * - recovers from stale lazy chunks after a deploy,
 * - shows an honest offline banner,
 * - confirms installation only after the browser fires `appinstalled`.
 */
export const PwaStatus = () => {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const online = useOnlineStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [staleAssets, setStaleAssets] = useState(false);
  const wasOffline = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      const checkForUpdate = () => {
        if (!navigator.onLine || registration.installing) return;
        registration.update().catch(() => undefined);
      };
      const onVisible = () => {
        if (document.visibilityState === "visible") checkForUpdate();
      };
      const interval = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
      document.addEventListener("visibilitychange", onVisible);
      cleanupRef.current = () => {
        window.clearInterval(interval);
        document.removeEventListener("visibilitychange", onVisible);
      };
    },
    onRegisterError(error) {
      console.warn("Service worker registration failed", error);
    }
  });

  useEffect(() => () => cleanupRef.current?.(), []);

  useEffect(() => {
    if (!offlineReady) return;
    dispatch(pushToast({ title: "Upwrite's app shell is saved on this device. Articles, sign-in and saving still need internet.", tone: "info" }));
    setOfflineReady(false);
  }, [dispatch, offlineReady, setOfflineReady]);

  useEffect(() => {
    const onInstalled = () => dispatch(pushToast({ title: "Upwrite is installed. Open it from your home screen or apps list.", tone: "success" }));
    // A lazily loaded route chunk from an older deploy is gone: ask for a reload instead of
    // crashing the route or reloading automatically.
    const onPreloadError = (event: Event) => {
      event.preventDefault();
      setStaleAssets(true);
    };
    window.addEventListener("upwrite:app-installed", onInstalled);
    window.addEventListener("vite:preloadError", onPreloadError);
    return () => {
      window.removeEventListener("upwrite:app-installed", onInstalled);
      window.removeEventListener("vite:preloadError", onPreloadError);
    };
  }, [dispatch]);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      setShowBackOnline(false);
      return;
    }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    setShowBackOnline(true);
    const timer = window.setTimeout(() => setShowBackOnline(false), 3000);
    return () => window.clearTimeout(timer);
  }, [online]);

  const reducedMotion = useReducedMotionPreference();
  const isEditing = pathname === "/write" || pathname.startsWith("/write/");
  const showUpdate = needRefresh || staleAssets;

  const reload = () => {
    if (needRefresh) void updateServiceWorker(true);
    else window.location.reload();
  };

  return (
    <>
      <AnimatePresence>
        {!online || showBackOnline ? (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 top-[calc(0.5rem+env(safe-area-inset-top))] z-[70] flex justify-center px-4"
          >
            <motion.div
              key={online ? "online" : "offline"}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: reducedMotion ? 0.08 : 0.18, ease: MOTION_EASE.out }}
              className={
                online
                  ? "pointer-events-auto flex items-center gap-2 rounded-full border border-accent-200 bg-white px-4 py-2 text-sm font-medium text-ink-800 shadow-lg dark:border-accent-900 dark:bg-ink-900 dark:text-ink-100"
                  : "pointer-events-auto flex max-w-xl items-start gap-2 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-2.5 text-sm text-amber-950 shadow-lg dark:border-amber-800/70 dark:bg-amber-950 dark:text-amber-100"
              }
            >
              {online ? (
                <>
                  <Wifi className="h-4 w-4 text-accent-600 dark:text-accent-300" aria-hidden="true" />
                  Back online
                </>
              ) : (
                <>
                  <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold">You're offline.</strong> Loading articles, signing in, saving, and AI features need an internet connection.
                  </span>
                </>
              )}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showUpdate ? (
          <motion.div
            key="pwa-update-banner"
            role="status"
            aria-live="polite"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: reducedMotion ? 0.08 : 0.2, ease: MOTION_EASE.out }}
            className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[65] mx-auto max-w-md rounded-2xl border border-ink-200 bg-white p-4 shadow-2xl dark:border-ink-800 dark:bg-ink-950 sm:inset-x-auto sm:right-4 lg:bottom-[calc(1rem+env(safe-area-inset-bottom))]"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-50 text-accent-700 dark:bg-accent-950/40 dark:text-accent-300">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-950 dark:text-ink-50">
                  {staleAssets && !needRefresh ? "Upwrite was updated" : "A new version of Upwrite is ready"}
                </p>
                <p className="mt-1 text-sm leading-5 text-ink-600 dark:text-ink-400">
                  {isEditing
                    ? "Save your draft first — reloading discards unsaved changes."
                    : staleAssets
                      ? "Reload to open this page with the latest version."
                      : "Reload when you're ready to get the latest version."}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={reload}
                    disabled={!online && !needRefresh}
                    className="inline-flex min-h-10 items-center rounded-lg bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800 focus-visible:ring-2 focus-visible:ring-accent-500 disabled:opacity-50 dark:bg-ink-50 dark:text-ink-950 dark:hover:bg-ink-200"
                  >
                    Reload
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNeedRefresh(false);
                      setStaleAssets(false);
                    }}
                    className="inline-flex min-h-10 items-center rounded-lg px-4 text-sm font-semibold text-ink-700 hover:bg-ink-100 focus-visible:ring-2 focus-visible:ring-accent-500 dark:text-ink-200 dark:hover:bg-ink-900"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};

