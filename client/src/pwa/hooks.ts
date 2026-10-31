import { useSyncExternalStore } from "react";
import { getInstallState, subscribeInstallState } from "./installPrompt";

export const useInstallState = () => useSyncExternalStore(subscribeInstallState, getInstallState, getInstallState);

const subscribeOnline = (listener: () => void) => {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
};

const getOnline = () => navigator.onLine;

/**
 * `navigator.onLine === false` reliably means "no network"; `true` only means a network
 * interface exists, so failed requests are still handled as errors elsewhere.
 */
export const useOnlineStatus = () => useSyncExternalStore(subscribeOnline, getOnline, () => true);

