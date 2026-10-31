import { Download, MonitorDown, Share, SquarePlus, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useAppDispatch } from "../app/hooks";
import { pushToast } from "../features/ui/uiSlice";
import { useInstallState } from "./hooks";
import { promptInstall, type InstallPlatform } from "./installPrompt";

export type InstallActionMode = "hidden" | "prompt" | "guide" | "pending";

/**
 * Decides whether an "Install app" control should be shown and what clicking it does.
 * Shown only when installation is applicable:
 * - If `beforeinstallprompt` is ready (`mode === "prompt"`), clicking triggers the native browser prompt.
 * - On iOS/iPadOS or macOS Safari (`mode === "guide"`), clicking opens tailored manual installation instructions.
 * - Hidden when running inside the standalone app or when no install flow is available.
 */
export const useInstallAction = () => {
  const state = useInstallState();
  const dispatch = useAppDispatch();
  const [guideOpen, setGuideOpen] = useState(false);
  const [prompting, setPrompting] = useState(false);

  let mode: InstallActionMode = "hidden";
  if (state.isStandalone || state.installedThisSession) mode = "hidden";
  else if (state.canPrompt) mode = "prompt";
  else if (state.awaitingInstall) mode = "pending";
  else mode = "guide";

  const label = mode === "pending" ? "Installing…" : "Install App";

  const onClick = async () => {
    if (mode === "guide") {
      setGuideOpen(true);
      return;
    }
    if (mode !== "prompt" || prompting) return;

    setPrompting(true);
    const outcome = await promptInstall();
    setPrompting(false);

    if (outcome === "error") {
      dispatch(pushToast({ title: "Couldn't open the install prompt. Follow the browser steps to install Upwrite.", tone: "error" }));
      setGuideOpen(true);
    } else if (outcome === "unavailable") {
      setGuideOpen(true);
    }
    // "accepted" is confirmed by the browser's `appinstalled` event (see PwaStatus);
    // "dismissed" needs no message — the user made a choice.
  };

  const guidePlatform: Exclude<InstallPlatform, "prompt"> =
    state.platform === "prompt" ? "chromium" : state.platform;

  const guide =
    mode !== "hidden" ? (
      <InstallGuideDialog open={guideOpen} platform={guidePlatform} onClose={() => setGuideOpen(false)} />
    ) : null;

  return {
    mode,
    label,
    onClick,
    disabled: mode === "pending" || prompting,
    guide,
    Icon: state.canPrompt ? Download : MonitorDown
  };
};

const Step = ({ index, children }: { index: number; children: ReactNode }) => (
  <li className="flex gap-3">
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-50 text-xs font-bold text-accent-700 dark:bg-accent-950/40 dark:text-accent-300">{index}</span>
    <span className="pt-0.5 text-sm leading-6 text-ink-700 dark:text-ink-200">{children}</span>
  </li>
);

export const InstallGuideDialog = ({
  open,
  platform,
  onClose
}: {
  open: boolean;
  platform: Exclude<InstallPlatform, "prompt">;
  onClose: () => void;
}) => {
  const ref = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;

    const outside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let pressedOutside = false;
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = outside(e);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && outside(e)) dialog.close();
    };
    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);
    return () => {
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  const subtitle =
    platform === "ios"
      ? "Add Upwrite to your Home Screen"
      : platform === "macos-safari"
        ? "Add Upwrite to your Dock"
        : "Install Upwrite on your device";

  return createPortal(
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="install-guide-title"
      // Light dismiss where supported; Esc / back gesture work everywhere.
      {...({ closedby: "any" } as Record<string, string>)}
      className="install-guide-dialog w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-ink-200 bg-white p-0 text-ink-900 shadow-2xl dark:border-ink-800 dark:bg-ink-950 dark:text-ink-50"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/apple-touch-icon.png" alt="" width={44} height={44} className="h-11 w-11 rounded-xl" />
            <div>
              <h2 id="install-guide-title" className="text-base font-semibold">Install Upwrite</h2>
              <p className="text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>
            </div>
          </div>
          <form method="dialog">
            <button type="submit" autoFocus aria-label="Close" className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-accent-500 dark:hover:bg-ink-900 dark:hover:text-ink-100">
              <X className="h-4 w-4" />
            </button>
          </form>
        </div>

        {platform === "ios" ? (
          <>
            <ol className="mt-5 grid gap-3">
              <Step index={1}>
                Tap the <strong>Share</strong> button <Share className="inline h-4 w-4 align-[-2px]" aria-label="Share icon" /> in Safari. On newer iOS versions it's inside the <strong>•••</strong> menu next to the address bar.
              </Step>
              <Step index={2}>
                Scroll down and choose <strong>Add to Home Screen</strong> <SquarePlus className="inline h-4 w-4 align-[-2px]" aria-label="Add icon" />.
              </Step>
              <Step index={3}>If you see <strong>Open as Web App</strong>, leave it on, then tap <strong>Add</strong>.</Step>
              <Step index={4}>Open Upwrite from your Home Screen for the full-screen app.</Step>
            </ol>
            <p className="mt-4 rounded-lg bg-ink-50 p-3 text-xs leading-5 text-ink-600 dark:bg-ink-900 dark:text-ink-400">
              Using Chrome or another browser on iPhone/iPad? Use its Share menu → Add to Home Screen, or open this page in Safari if the option is missing.
            </p>
          </>
        ) : platform === "macos-safari" ? (
          <ol className="mt-5 grid gap-3">
            <Step index={1}>
              In Safari's menu bar choose <strong>File → Add to Dock…</strong> (or use the Share button → <strong>Add to Dock</strong>).
            </Step>
            <Step index={2}>Click <strong>Add</strong>. Upwrite opens in its own window from the Dock or Launchpad.</Step>
          </ol>
        ) : (
          <>
            <ol className="mt-5 grid gap-3">
              <Step index={1}>
                Look at the right side of your browser's address bar for the <strong>Install</strong> icon <MonitorDown className="inline h-4 w-4 align-[-2px]" aria-label="Install icon" /> (or open the browser menu <strong>⋮ / •••</strong>).
              </Step>
              <Step index={2}>
                Choose <strong>Install Upwrite</strong> (in Chrome: <strong>Cast, save, and share → Install page as app…</strong>; in Edge: <strong>Apps → Install this site as an app</strong>; on Android: <strong>Add to Home screen / Install app</strong>).
              </Step>
              <Step index={3}>Confirm <strong>Install</strong> to launch Upwrite in its own standalone window.</Step>
            </ol>
            {import.meta.env.DEV ? (
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                <strong>Dev mode note:</strong> The service worker is disabled during <code>npm run dev</code> to prevent stale caches. To test one-click native install locally, run <code>npm run build &amp;&amp; npm run preview</code> and open <code>http://localhost:4173</code>.
              </p>
            ) : (
              <p className="mt-4 rounded-lg bg-ink-50 p-3 text-xs leading-5 text-ink-600 dark:bg-ink-900 dark:text-ink-400">
                If you already installed Upwrite on this device, look for <strong>Open in app</strong> in the address bar or launch Upwrite from your desktop / apps menu.
              </p>
            )}
          </>
        )}

        <form method="dialog" className="mt-5 flex justify-end">
          <button type="submit" className="inline-flex min-h-10 items-center rounded-lg bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800 focus-visible:ring-2 focus-visible:ring-accent-500 dark:bg-ink-50 dark:text-ink-950 dark:hover:bg-ink-200">
            Got it
          </button>
        </form>
      </div>
    </dialog>,
    document.body
  );
};
