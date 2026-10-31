import { getEffectiveReducedMotion } from "./system";

export type ArticleNavigationMode = "open" | "continue";

export type NavigationClassification =
  | "initial"
  | "same-page-param"
  | "hash-change"
  | "article-open"
  | "continue-reading"
  | "pop"
  | "new-page";

export interface PendingArticleNavigation {
  instanceId: string;
  articleId?: string;
  slug: string;
  username?: string;
  mode: ArticleNavigationMode;
  hasThumbnail?: boolean;
  activatedAt: number;
  originPath: string;
  originScrollY: number;
}

interface ScrollEntry {
  scrollY: number;
  pathname: string;
  search: string;
  lastInstanceId?: string;
  lastArticleHref?: string;
  updatedAt: number;
}

const ARTICLE_TRANSITION_TTL_MS = 4000;
const MAX_SCROLL_ENTRIES = 60;

let pendingArticleNav: PendingArticleNavigation | null = null;
let activeThumbnailElement: HTMLElement | null = null;
let activeTransitionCleanupTimer = 0;

const scrollByHistoryKey = new Map<string, ScrollEntry>();
const scrollByLocationPath = new Map<string, ScrollEntry>();

export function isModifiedNavigationEvent(event: {
  button?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  defaultPrevented?: boolean;
}): boolean {
  return Boolean(
    event.defaultPrevented ||
      (typeof event.button === "number" && event.button !== 0) ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
  );
}

export function clearActiveViewTransitionNames(): void {
  if (activeTransitionCleanupTimer && typeof window !== "undefined") {
    window.clearTimeout(activeTransitionCleanupTimer);
    activeTransitionCleanupTimer = 0;
  }
  if (activeThumbnailElement) {
    delete activeThumbnailElement.dataset.vtThumb;
    activeThumbnailElement = null;
  }
  if (typeof document !== "undefined") {
    document.querySelectorAll<HTMLElement>("[data-vt-thumb]").forEach((node) => {
      delete node.dataset.vtThumb;
    });
  }
}

/**
 * Records user activation of an article link immediately before navigation.
 * Tracks the exact clicked instanceId so duplicate occurrences of the same
 * article on the page (e.g., Today feed + Continue reading rail) never collide.
 */
export function recordArticleActivation(input: {
  instanceId?: string;
  articleId?: string;
  slug: string;
  username?: string;
  mode?: ArticleNavigationMode;
  hasThumbnail?: boolean;
  thumbnailElement?: HTMLElement | null;
  locationKey?: string;
  sourcePath?: string;
  sourceScrollY?: number;
}): PendingArticleNavigation {
  clearActiveViewTransitionNames();

  const resolvedInstanceId = input.instanceId ?? `article:${input.slug}`;
  const originPath =
    input.sourcePath ??
    (typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/");
  const originScrollY =
    typeof input.sourceScrollY === "number"
      ? input.sourceScrollY
      : typeof window !== "undefined"
        ? window.scrollY
        : 0;

  if (typeof window !== "undefined") {
    rememberScrollPosition({
      locationKey: input.locationKey ?? "default",
      pathname: window.location.pathname,
      search: window.location.search,
      scrollY: originScrollY,
      lastInstanceId: resolvedInstanceId,
      lastArticleHref:
        input.username && input.slug ? `/articles/${input.username.replace(/^@/, "")}/${input.slug}` : undefined
    });
  }

  if (
    input.thumbnailElement &&
    input.hasThumbnail &&
    (input.mode ?? "open") === "open" &&
    !getEffectiveReducedMotion()
  ) {
    activeThumbnailElement = input.thumbnailElement;
    activeThumbnailElement.dataset.vtThumb = "active";
    if (typeof window !== "undefined") {
      activeTransitionCleanupTimer = window.setTimeout(clearActiveViewTransitionNames, 900);
    }
  }

  pendingArticleNav = {
    instanceId: resolvedInstanceId,
    articleId: input.articleId,
    slug: input.slug,
    username: input.username?.replace(/^@/, ""),
    mode: input.mode ?? "open",
    hasThumbnail: Boolean(input.hasThumbnail),
    activatedAt: Date.now(),
    originPath,
    originScrollY
  };

  return pendingArticleNav;
}

export function peekPendingArticleNavigation(slug?: string): PendingArticleNavigation | null {
  if (!pendingArticleNav) return null;
  if (Date.now() - pendingArticleNav.activatedAt > ARTICLE_TRANSITION_TTL_MS) {
    pendingArticleNav = null;
    return null;
  }
  if (slug && pendingArticleNav.slug !== slug) {
    return null;
  }
  return pendingArticleNav;
}

export function consumePendingArticleNavigation(slug: string): PendingArticleNavigation | null {
  const match = peekPendingArticleNavigation(slug);
  if (match) {
    pendingArticleNav = null;
  }
  return match;
}

export function clearPendingArticleNavigation(): void {
  pendingArticleNav = null;
  clearActiveViewTransitionNames();
}

/**
 * Progressive-enhancement wrapper for `document.startViewTransition` when opening
 * an article with a matched source thumbnail. Never blocks navigation or captures
 * the persistent app shell.
 */
export function runOptionalThumbnailViewTransition(
  performNavigation: () => void,
  options?: { enabled?: boolean }
): void {
  const doc = typeof document !== "undefined" ? (document as Document & {
    startViewTransition?: (callback: () => void) => {
      finished: Promise<void>;
      ready: Promise<void>;
      updateCallbackDone: Promise<void>;
      skipTransition: () => void;
    };
  }) : null;

  if (
    !options?.enabled ||
    !doc ||
    typeof doc.startViewTransition !== "function" ||
    getEffectiveReducedMotion() ||
    !activeThumbnailElement
  ) {
    clearActiveViewTransitionNames();
    performNavigation();
    return;
  }

  let didNavigate = false;
  const safeNavigate = () => {
    if (didNavigate) return;
    didNavigate = true;
    performNavigation();
  };

  try {
    const transition = doc.startViewTransition(() => {
      safeNavigate();
    });
    transition.finished
      .catch(() => undefined)
      .finally(() => {
        clearActiveViewTransitionNames();
      });
  } catch {
    clearActiveViewTransitionNames();
    safeNavigate();
  }
}

export function rememberScrollPosition(input: {
  locationKey: string;
  pathname: string;
  search: string;
  scrollY?: number;
  lastInstanceId?: string;
  lastArticleHref?: string;
}): void {
  if (typeof window === "undefined" && typeof input.scrollY !== "number") return;
  const pathKey = `${input.pathname}${input.search}`;
  const existing = scrollByHistoryKey.get(input.locationKey) ?? scrollByLocationPath.get(pathKey);
  const entry: ScrollEntry = {
    scrollY: typeof input.scrollY === "number" ? input.scrollY : typeof window !== "undefined" ? window.scrollY : 0,
    pathname: input.pathname,
    search: input.search,
    lastInstanceId: input.lastInstanceId ?? existing?.lastInstanceId,
    lastArticleHref: input.lastArticleHref ?? existing?.lastArticleHref,
    updatedAt: Date.now()
  };

  scrollByHistoryKey.set(input.locationKey, entry);
  scrollByLocationPath.set(pathKey, entry);

  if (scrollByHistoryKey.size > MAX_SCROLL_ENTRIES) {
    const oldestKey = scrollByHistoryKey.keys().next().value;
    if (oldestKey) scrollByHistoryKey.delete(oldestKey);
  }
  if (scrollByLocationPath.size > MAX_SCROLL_ENTRIES) {
    const oldestPath = scrollByLocationPath.keys().next().value;
    if (oldestPath) scrollByLocationPath.delete(oldestPath);
  }
}

export function getRememberedScrollEntry(locationKey: string, pathname: string, search: string): ScrollEntry | null {
  return (
    scrollByHistoryKey.get(locationKey) ??
    scrollByLocationPath.get(`${pathname}${search}`) ??
    null
  );
}

/**
 * Restores focus to the originating article link after Browser Back when
 * available, without scrolling the page or stealing focus if the user has
 * already moved focus to an interactive control.
 */
export function restoreOriginatingArticleFocus(entry: ScrollEntry | null): boolean {
  if (typeof document === "undefined" || !entry) return false;
  const active = document.activeElement;
  if (
    active &&
    active !== document.body &&
    active !== document.documentElement &&
    (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")
  ) {
    return false;
  }

  let target: HTMLElement | null = null;
  if (entry.lastInstanceId) {
    const escaped = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(entry.lastInstanceId) : entry.lastInstanceId;
    target = document.querySelector<HTMLElement>(`[data-article-instance="${escaped}"]`);
  }
  if (!target && entry.lastArticleHref) {
    const escapedHref =
      typeof CSS !== "undefined" && CSS.escape ? CSS.escape(entry.lastArticleHref) : entry.lastArticleHref;
    target = document.querySelector<HTMLElement>(`a[href="${escapedHref}"]`);
  }

  if (target && typeof target.focus === "function") {
    try {
      target.focus({ preventScroll: true });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function isArticleDetailPath(pathname: string): boolean {
  return /^\/articles\/[^/]+\/[^/]+\/?$/.test(pathname);
}

export function classifyNavigation(input: {
  prevPathname: string | null;
  prevSearch: string | null;
  prevHash: string | null;
  nextPathname: string;
  nextSearch: string;
  nextHash: string;
  navigationType: "POP" | "PUSH" | "REPLACE";
  locationState?: unknown;
}): NavigationClassification {
  if (input.prevPathname === null) {
    return "initial";
  }

  // Treat `/` and `/today` as the same Today workspace route
  const normalizeRoute = (p: string) => (p === "/today" ? "/" : p);
  const sameNormalizedPath = normalizeRoute(input.prevPathname) === normalizeRoute(input.nextPathname);

  if (sameNormalizedPath) {
    if (input.prevSearch !== input.nextSearch) {
      return "same-page-param";
    }
    if (input.prevHash !== input.nextHash) {
      return "hash-change";
    }
    return "same-page-param";
  }

  if (input.navigationType === "POP") {
    return "pop";
  }

  if (isArticleDetailPath(input.nextPathname)) {
    const slug = input.nextPathname.split("/").filter(Boolean)[2] ?? "";
    const pending = peekPendingArticleNavigation(slug);
    const stateMode = (input.locationState as { articleNavMode?: ArticleNavigationMode } | null)?.articleNavMode;
    const mode = pending?.mode ?? stateMode ?? "open";
    return mode === "continue" ? "continue-reading" : "article-open";
  }

  return "new-page";
}

