import { useEffect, useState } from "react";
import type { Transition, Variants } from "framer-motion";
import { useAppSelector } from "../app/hooks";
import { resetDockScroll } from './scrollAwareDock';

/**
 * Shared Upwrite Motion Tokens
 * Kept in lockstep with CSS custom properties in `src/styles/index.css`.
 */
const EASE_OUT_TUPLE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_IN_TUPLE: [number, number, number, number] = [0.4, 0, 1, 1];
const EASE_IN_OUT_TUPLE: [number, number, number, number] = [0.4, 0, 0.2, 1];

export type MotionEaseTupleWithAliases = [number, number, number, number] & {
  readonly out: [number, number, number, number];
  readonly in: [number, number, number, number];
  readonly inOut: [number, number, number, number];
};

export const MOTION_EASE: MotionEaseTupleWithAliases = Object.assign(
  [...EASE_OUT_TUPLE] as [number, number, number, number],
  {
    out: EASE_OUT_TUPLE,
    in: EASE_IN_TUPLE,
    inOut: EASE_IN_OUT_TUPLE
  }
);
export const MOTION_EXIT_EASE: [number, number, number, number] = EASE_IN_TUPLE;
export const MOTION_IN_OUT_EASE: [number, number, number, number] = EASE_IN_OUT_TUPLE;

export const MOTION_DURATION = {
  instant: 0,
  press: 0.1,            // 100ms (80–120ms press feedback)
  fast: 0.14,            // 140ms (120–160ms small effects & tab indicators)
  small: 0.14,           // 140ms alias
  menu: 0.17,            // 170ms (160–200ms menus & local reveals)
  menuExit: 0.12,        // 120ms (100–140ms popover exit)
  normal: 0.18,          // 180ms (160–200ms route / section reveal)
  reveal: 0.18,          // 180ms alias
  dockHide: 0.7,         // In sync with --motion-dock-hide
  dockReveal: 0.42,      // In sync with --motion-dock-reveal
  navigationIndicator: 0.5,
  routeReveal: 0.56,
  dialog: 0.2,           // 200ms (180–220ms modal dialogs)
  dialogExit: 0.14,      // 140ms
  panel: 0.24,           // 240ms (220–260ms side panels / drawers)
  panelExit: 0.18,       // 180ms
  sheet: 0.26,           // 260ms (240–280ms mobile bottom sheets)
  sheetExit: 0.18,       // 180ms
  articleDesktop: 0.36,  // 360ms signature desktop article rise
  articleMobile: 0.3,    // 300ms signature mobile article rise
  reducedFade: 0.08      // 80ms restrained reduced-motion fade
} as const;

export const MOTION_SPRING = {
  indicator: {
    type: "spring" as const,
    stiffness: 420,
    damping: 34,
    mass: 0.8
  },
  sheet: {
    type: "spring" as const,
    stiffness: 360,
    damping: 34,
    mass: 0.9
  }
} as const;

export const GUEST_REDUCE_MOTION_KEY = "upwrite-reduce-motion";
export const MOTION_PREF_EVENT = "upwrite:motion-preference-change";

export function readStoredReduceMotionPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(GUEST_REDUCE_MOTION_KEY) === "true";
  } catch {
    return false;
  }
}

export function writeStoredReduceMotionPreference(reduceMotion: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_REDUCE_MOTION_KEY, String(Boolean(reduceMotion)));
  } catch {
    // Ignore storage quota or private mode restrictions
  }
  window.dispatchEvent(new CustomEvent(MOTION_PREF_EVENT, { detail: { reduceMotion: Boolean(reduceMotion) } }));
}

export const setGuestReducedMotionPreference = writeStoredReduceMotionPreference;

export function getOsReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Resolves the effective reduced-motion state from both the operating system
 * and the Upwrite application preference. If either requests reduced motion,
 * motion is reduced (an unchecked app setting never overrides an OS request).
 */
export function resolveEffectiveReducedMotion(options: {
  osReducedMotion: boolean;
  userReduceMotion?: boolean | null;
  storedReduceMotion?: boolean;
}): boolean {
  const appPref =
    typeof options.userReduceMotion === "boolean"
      ? options.userReduceMotion
      : Boolean(options.storedReduceMotion);
  return Boolean(options.osReducedMotion || appPref);
}

/**
 * Synchronous check for imperative callers (scroll helpers, view transitions, etc.)
 */
export function getEffectiveReducedMotion(): boolean {
  if (typeof document !== "undefined" && document.documentElement.dataset.motion === "reduced") {
    return true;
  }
  return resolveEffectiveReducedMotion({
    osReducedMotion: getOsReducedMotion(),
    storedReduceMotion: readStoredReduceMotionPreference()
  });
}

/**
 * Hook that subscribes to both OS `prefers-reduced-motion` changes and
 * Upwrite's user/guest reduce-motion preference without requiring a reload.
 */
export function useReducedMotionPreference(): boolean {
  const userReduceMotion = useAppSelector((state) => state.auth.user?.appearanceSettings?.reduceMotion);
  const [osReducedMotion, setOsReducedMotion] = useState<boolean>(() => getOsReducedMotion());
  const [storedReduceMotion, setStoredReduceMotion] = useState<boolean>(() => readStoredReduceMotionPreference());

  useEffect(() => {
    if (typeof userReduceMotion === "boolean") {
      writeStoredReduceMotionPreference(userReduceMotion);
      setStoredReduceMotion(userReduceMotion);
    }
  }, [userReduceMotion]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMediaChange = () => setOsReducedMotion(media.matches);
    const onCustomChange = () => setStoredReduceMotion(readStoredReduceMotionPreference());
    const onStorageChange = (event: StorageEvent) => {
      if (event.key === GUEST_REDUCE_MOTION_KEY) {
        setStoredReduceMotion(readStoredReduceMotionPreference());
      }
    };

    setOsReducedMotion(media.matches);
    media.addEventListener("change", onMediaChange);
    window.addEventListener(MOTION_PREF_EVENT, onCustomChange);
    window.addEventListener("storage", onStorageChange);
    return () => {
      media.removeEventListener("change", onMediaChange);
      window.removeEventListener(MOTION_PREF_EVENT, onCustomChange);
      window.removeEventListener("storage", onStorageChange);
    };
  }, []);

  return resolveEffectiveReducedMotion({
    osReducedMotion,
    userReduceMotion,
    storedReduceMotion
  });
}

/**
 * Preference-aware scrolling helpers
 */
export function scrollWindowWithMotionPreference(
  options: { top?: number; left?: number; forceInstant?: boolean } | number,
  maybeReducedMotion?: boolean
): void {
  if (typeof window === "undefined") return;
  resetDockScroll();
  if (typeof options === "number") {
    const instant = Boolean(maybeReducedMotion) || getEffectiveReducedMotion();
    window.scrollTo({
      top: options,
      left: 0,
      behavior: instant ? "auto" : "smooth"
    });
    return;
  }
  const instant = options.forceInstant || Boolean(maybeReducedMotion) || getEffectiveReducedMotion();
  window.scrollTo({
    top: options.top ?? 0,
    left: options.left ?? 0,
    behavior: instant ? "auto" : "smooth"
  });
}

export function scrollElementIntoViewWithMotionPreference(
  element: Element | null | undefined,
  optionsOrReducedMotion?: (ScrollIntoViewOptions & { forceInstant?: boolean }) | boolean,
  maybeOptions?: ScrollIntoViewOptions & { forceInstant?: boolean }
): void {
  if (!element) return;
  resetDockScroll();
  const options =
    typeof optionsOrReducedMotion === "boolean" ? maybeOptions : optionsOrReducedMotion;
  const explicitReduced =
    typeof optionsOrReducedMotion === "boolean" ? optionsOrReducedMotion : false;
  const instant = explicitReduced || options?.forceInstant || getEffectiveReducedMotion();
  element.scrollIntoView({
    block: options?.block ?? "start",
    inline: options?.inline ?? "nearest",
    behavior: instant ? "auto" : (options?.behavior ?? "smooth")
  });
}

/**
 * Shared Framer Motion transition & variant builders
 */
export function getPopoverVariants(
  reducedMotion: boolean,
  direction: "down" | "up" = "down"
): Variants {
  if (reducedMotion) {
    return {
      initial: { opacity: 0, y: 0, scale: 1 },
      animate: { opacity: 1, y: 0, scale: 1, transition: { duration: MOTION_DURATION.reducedFade } },
      exit: { opacity: 0, y: 0, scale: 1, transition: { duration: MOTION_DURATION.instant } }
    };
  }
  const offset = direction === "down" ? -5 : 5;
  return {
    initial: { opacity: 0, y: offset, scale: 0.985 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: MOTION_DURATION.menu, ease: EASE_OUT_TUPLE }
    },
    exit: {
      opacity: 0,
      y: direction === "down" ? -4 : 4,
      scale: 0.99,
      transition: { duration: MOTION_DURATION.menuExit, ease: MOTION_EXIT_EASE }
    }
  };
}

export function getDialogBackdropVariants(reducedMotion: boolean): Variants {
  const duration = reducedMotion ? MOTION_DURATION.reducedFade : MOTION_DURATION.menu;
  const exitDuration = reducedMotion ? MOTION_DURATION.instant : MOTION_DURATION.menuExit;
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration, ease: EASE_OUT_TUPLE } },
    exit: { opacity: 0, transition: { duration: exitDuration, ease: MOTION_EXIT_EASE } }
  };
}

export const getBackdropVariants = getDialogBackdropVariants;

export function getDialogPanelVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      initial: { opacity: 0, y: 0 },
      animate: { opacity: 1, y: 0, transition: { duration: MOTION_DURATION.reducedFade } },
      exit: { opacity: 0, y: 0, transition: { duration: MOTION_DURATION.instant } }
    };
  }
  return {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: MOTION_DURATION.dialog, ease: EASE_OUT_TUPLE }
    },
    exit: {
      opacity: 0,
      y: 8,
      transition: { duration: MOTION_DURATION.dialogExit, ease: MOTION_EXIT_EASE }
    }
  };
}

export const getModalVariants = getDialogPanelVariants;

export function getSidePanelVariants(
  reducedMotion: boolean,
  edge: "right" | "left" = "right"
): Variants {
  if (reducedMotion) {
    return {
      initial: { opacity: 0, x: 0 },
      animate: { opacity: 1, x: 0, transition: { duration: MOTION_DURATION.reducedFade } },
      exit: { opacity: 0, x: 0, transition: { duration: MOTION_DURATION.instant } }
    };
  }
  const offset = edge === "right" ? "100%" : "-100%";
  return {
    initial: { opacity: 0.92, x: offset },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: MOTION_DURATION.panel, ease: EASE_OUT_TUPLE }
    },
    exit: {
      opacity: 0.92,
      x: offset,
      transition: { duration: MOTION_DURATION.panelExit, ease: MOTION_EXIT_EASE }
    }
  };
}

export const getDrawerVariants = getSidePanelVariants;

export function getBottomSheetVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      initial: { opacity: 0, y: 0 },
      animate: { opacity: 1, y: 0, transition: { duration: MOTION_DURATION.reducedFade } },
      exit: { opacity: 0, y: 0, transition: { duration: MOTION_DURATION.instant } }
    };
  }
  return {
    initial: { y: "100%" },
    animate: {
      y: 0,
      transition: { duration: MOTION_DURATION.sheet, ease: EASE_OUT_TUPLE }
    },
    exit: {
      y: "100%",
      transition: { duration: MOTION_DURATION.sheetExit, ease: MOTION_EXIT_EASE }
    }
  };
}

export function getLocalRevealTransition(reducedMotion: boolean): {
  initial: { opacity: number; y?: number };
  animate: { opacity: number; y: number };
  transition: Transition;
} {
  return {
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    transition: reducedMotion
      ? { duration: MOTION_DURATION.reducedFade }
      : { duration: MOTION_DURATION.small, ease: EASE_OUT_TUPLE }
  };
}

/**
 * Pure helper to determine if a global flashcard keyboard shortcut should be ignored
 * because focus is inside an editable field or interactive control.
 */
export function shouldIgnoreFlashcardShortcut(target: EventTarget | null, key?: string): boolean {
  if (!target || typeof target !== "object") return false;
  const el = target as Partial<HTMLElement>;
  const tagName = typeof el.tagName === "string" ? el.tagName.toUpperCase() : "";
  if (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    Boolean(el.isContentEditable)
  ) {
    return true;
  }
  if ((key === " " || key === "Enter") && typeof el.closest === "function") {
    const interactive = el.closest("button, a, [role='button'], [role='link']");
    if (interactive) return true;
  }
  return false;
}
