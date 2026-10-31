/** Intentional content movement only; coordinates never enter React state. */
export const DOCK_SCROLL = { top: 48, hide: 48, reveal: 10, noise: 2, end: 2, settle: 160 } as const;
export const DOCK_RESET_EVENT = 'upwrite:dock-scroll-reset';
export const DOCK_MODAL_EVENT = 'upwrite:dock-modal-change';

export function resetDockScroll(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(DOCK_RESET_EVENT));
}

export type DockReason = 'suppressed' | 'keyboard' | 'interaction' | 'reduced-motion' | 'persistent' | 'boundary' | 'scroll';
export interface DockPolicy {
  suppressed: boolean;
  keyboard: boolean;
  pinned: boolean;
  reducedMotion: boolean;
  autoHide: boolean;
}
export interface DockVisibility { hidden: boolean; reason: DockReason }

export function dockVisibility(policy: DockPolicy, scrollHidden: boolean, boundary: boolean): DockVisibility {
  if (policy.suppressed) return { hidden: true, reason: 'suppressed' };
  if (policy.keyboard) return { hidden: true, reason: 'keyboard' };
  if (policy.pinned) return { hidden: false, reason: 'interaction' };
  if (policy.reducedMotion) return { hidden: false, reason: 'reduced-motion' };
  if (!policy.autoHide) return { hidden: false, reason: 'persistent' };
  if (boundary) return { hidden: false, reason: 'boundary' };
  return { hidden: scrollHidden, reason: 'scroll' };
}

export class DockDirection {
  position = 0;
  maximum = 0;
  hidden = false;
  private direction = 0;
  private distance = 0;
  private endRevealed = false;

  reset(position: number, maximum: number, reveal = true) {
    this.maximum = Math.max(0, maximum);
    this.position = this.normalize(position);
    this.direction = 0;
    this.distance = 0;
    this.endRevealed = false;
    if (reveal) this.hidden = false;
  }

  private normalize(position: number) { return Math.max(0, Math.min(this.maximum, position)); }
  get boundary() { return this.maximum <= DOCK_SCROLL.top || this.position <= DOCK_SCROLL.top || this.endRevealed; }

  move(position: number, intentional: boolean) {
    const next = this.normalize(position);
    const delta = next - this.position;
    // Keep the previous sample for subpixel deltas so slow intentional movement
    // still accumulates. Alternating noise cannot build directional distance.
    if (Math.abs(delta) < DOCK_SCROLL.noise) return;
    this.position = next;
    if (this.maximum - next > DOCK_SCROLL.hide) this.endRevealed = false;
    if (!intentional || next <= DOCK_SCROLL.top || this.maximum <= DOCK_SCROLL.top) {
      this.reset(next, this.maximum, next <= DOCK_SCROLL.top || this.maximum <= DOCK_SCROLL.top);
      return;
    }
    const direction = Math.sign(delta);
    if (direction !== this.direction) { this.direction = direction; this.distance = 0; }
    this.distance += Math.abs(delta);
    if (direction > 0 && this.distance >= DOCK_SCROLL.hide && !this.endRevealed) this.hidden = true;
    if (direction < 0 && this.distance >= DOCK_SCROLL.reveal) this.hidden = false;
  }

  settle() {
    // Reveal only at the real end after momentum has stopped. Latch until the
    // reader leaves the boundary, avoiding rubber-band hide/reveal cycles.
    if (this.maximum - this.position <= DOCK_SCROLL.end) {
      this.hidden = false;
      this.endRevealed = true;
      this.direction = 0;
      this.distance = 0;
    }
  }
}

export function isTextEntry(element: Element | null): boolean {
  if (!element) return false;
  return (Boolean((element as HTMLElement).isContentEditable) || element.matches('textarea, [contenteditable]:not([contenteditable="false"]), input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="file"]):not([type="reset"])')) &&
    !element.hasAttribute('readonly') && !element.hasAttribute('disabled');
}

/** Both edit focus and a substantial unzoomed viewport occlusion are required. */
export function keyboardOccupiesBottom(input: { editable: boolean; baseline: number; height: number; scale: number; widthChanged: boolean }) {
  return input.editable && !input.widthChanged && Math.abs(input.scale - 1) < 0.05 &&
    input.baseline - input.height > Math.max(150, input.baseline * 0.2);
}

/**
 * Window is the scroll owner on app/reader routes. The writing workspace opts
 * out: its textarea, preview and sidebar have independent scroll owners.
 * Listeners on window are deliberately non-capturing: sheet/table/code scrolls
 * never feed this controller. Input intent is also checked for nested owners.
 */
export function attachScrollAwareDock(
  dock: HTMLElement,
  initial: Pick<DockPolicy, 'suppressed' | 'pinned' | 'reducedMotion' | 'autoHide'>,
  win: Window = window,
  doc: Document = document
) {
  const direction = new DockDirection();
  let options = initial;
  let intentional = false;
  let keyboard = false;
  let keyboardNavigation = false;
  let modal = doc.body.style.overflow === 'hidden';
  let focusWithin = dock.contains(doc.activeElement);
  const pointers = new Set<number>();
  let frame = 0;
  let settleTimer = 0;
  let focusFrame = 0;
  let viewportHeight = win.innerHeight;
  let viewportWidth = win.innerWidth;
  let rotatedKeyboardHeight: number | null = null;
  let disposed = false;
  let visibility: DockVisibility | undefined;
  const cleanups: (() => void)[] = [];
  const listen = (target: EventTarget, name: string, handler: EventListener, config?: AddEventListenerOptions) => {
    target.addEventListener(name, handler, config);
    cleanups.push(() => target.removeEventListener(name, handler, config));
  };
  const maximum = () => Math.max(0, doc.documentElement.scrollHeight - win.innerHeight);
  const publish = () => {
    const next = dockVisibility({ ...options, keyboard, suppressed: options.suppressed || modal,
      pinned: options.pinned || focusWithin || pointers.size > 0 || keyboardNavigation }, direction.hidden, direction.boundary);
    // Never move a still-focused control. Modal focus traps transfer focus out
    // before suppression; Focus mode removes its own toolbar explicitly.
    if (focusWithin) next.hidden = false;
    if (visibility?.hidden === next.hidden && visibility.reason === next.reason) return;
    visibility = next;
    dock.dataset.dockHidden = String(next.hidden);
    dock.dataset.dockReason = next.reason;
  };
  const clearSettle = () => { win.clearTimeout(settleTimer); settleTimer = 0; };
  const reset = (reveal = true) => {
    intentional = false;
    clearSettle();
    direction.reset(win.scrollY, maximum(), reveal);
    publish();
  };
  const settle = () => {
    clearSettle();
    intentional = false;
    direction.settle();
    publish();
  };
  const scroll = () => {
    if (!frame) frame = win.requestAnimationFrame(() => {
      frame = 0;
      direction.move(win.scrollY, intentional && !modal && !keyboard);
      publish();
    });
    clearSettle();
    settleTimer = win.setTimeout(settle, DOCK_SCROLL.settle);
  };
  const pageInput = (target: EventTarget | null) => {
    let element = target instanceof Element ? target : null;
    if (element?.closest('.reader-surface, [role="dialog"], [data-scroll-dock]')) return false;
    while (element && element !== doc.body && element !== doc.documentElement) {
      const style = win.getComputedStyle(element);
      if (/(auto|scroll)/.test(`${style.overflowY} ${style.overflowX}`) &&
        (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth)) return false;
      element = element.parentElement;
    }
    return true;
  };
  const intent = (event: Event) => {
    if (!pageInput(event.target)) { intentional = false; return; }
    // A new gesture starts at the actual position, after any restoration,
    // pagination or programmatic movement that happened between gestures.
    if (!intentional && (Math.abs(direction.position - win.scrollY) >= DOCK_SCROLL.noise || direction.maximum !== maximum())) {
      direction.reset(win.scrollY, maximum(), false);
    }
    intentional = true;
    keyboardNavigation = false;
    if (!focusWithin) delete dock.dataset.dockInstant;
    publish();
  };
  const keydown = (event: Event) => {
    const key = (event as KeyboardEvent).key;
    if (key === 'Tab') {
      keyboardNavigation = true;
      // Synchronous transform override, before the browser moves focus.
      dock.dataset.dockInstant = 'true';
      publish();
    } else if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(key) && !isTextEntry(doc.activeElement)) intent(event);
  };
  const updateViewport = () => {
    const vv = win.visualViewport;
    const height = vv?.height ?? win.innerHeight;
    const editable = isTextEntry(doc.activeElement);
    const widthChanged = Math.abs(win.innerWidth - viewportWidth) > 40;
    if (widthChanged) {
      // Android may resize both layout and visual viewports. If already typing,
      // rotating must not briefly put the dock above a still-open keyboard.
      if (keyboard && editable) rotatedKeyboardHeight = height;
      viewportWidth = win.innerWidth;
      viewportHeight = win.innerHeight;
    }
    let nextKeyboard = keyboardOccupiesBottom({ editable, baseline: viewportHeight,
      height, scale: vv?.scale ?? 1, widthChanged });
    if (rotatedKeyboardHeight !== null) {
      if (!editable || height - rotatedKeyboardHeight > Math.max(100, rotatedKeyboardHeight * 0.2)) {
        rotatedKeyboardHeight = null;
        viewportHeight = Math.max(viewportHeight, win.innerHeight);
      } else nextKeyboard = true;
    }
    if (!nextKeyboard && !editable) viewportHeight = Math.max(viewportHeight, win.innerHeight);
    const keyboardClosed = keyboard && !nextKeyboard;
    keyboard = nextKeyboard;
    // Geometry changes establish a new baseline without reopening a hidden dock.
    reset(keyboardClosed);
  };
  const focus = () => {
    const wasFocused = focusWithin;
    focusWithin = dock.contains(doc.activeElement);
    if (focusWithin) dock.dataset.dockInstant = 'true';
    else delete dock.dataset.dockInstant;
    updateViewport();
    // A focus reveal must not leave a zero-duration override behind, or replay
    // downward movement accumulated while that control was pinned.
    if (wasFocused && !focusWithin) reset();
  };
  const focusout = () => {
    if (focusFrame) win.cancelAnimationFrame(focusFrame);
    focusFrame = win.requestAnimationFrame(() => { focusFrame = 0; focus(); });
  };
  const down = (event: Event) => {
    keyboardNavigation = false;
    delete dock.dataset.dockInstant;
    if (dock.contains(event.target as Node)) pointers.add((event as PointerEvent).pointerId);
    publish();
  };
  const up = (event: Event) => {
    const released = pointers.delete((event as PointerEvent).pointerId);
    if (released && pointers.size === 0) reset();
    else publish();
  };
  const modalChange = (event: Event) => {
    const wasModal = modal;
    modal = (event as CustomEvent<boolean>).detail;
    reset(wasModal && !modal);
  };
  const restoration = () => reset();
  listen(win, 'scroll', scroll, { passive: true });
  // Debounced fallback also works where scrollend is unavailable. It only
  // reveals at the document boundary, never on ordinary idle.
  listen(win, 'wheel', intent, { passive: true });
  listen(win, 'touchmove', intent, { passive: true });
  listen(doc, 'keydown', keydown, { capture: true });
  listen(doc, 'pointerdown', down, { capture: true, passive: true });
  listen(win, 'pointerup', up, { passive: true });
  listen(win, 'pointercancel', up, { passive: true });
  listen(doc, 'focusin', focus);
  listen(doc, 'focusout', focusout);
  listen(win, 'resize', updateViewport, { passive: true });
  if (win.visualViewport) listen(win.visualViewport, 'resize', updateViewport, { passive: true });
  listen(win, DOCK_MODAL_EVENT, modalChange);
  listen(win, DOCK_RESET_EVENT, restoration);
  listen(win, 'pageshow', restoration);
  listen(win, 'hashchange', restoration);
  listen(win, 'blur', () => { pointers.clear(); intentional = false; publish(); });
  const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
    // Late images and pagination can move the scroll anchor. Rebaseline; do not
    // classify loading as a gesture or change visibility just because it loaded.
    if (!disposed) reset(false);
  }) : null;
  resize?.observe(doc.body);
  reset();
  return {
    update(next: typeof initial) {
      const released = (options.pinned && !next.pinned) || (options.suppressed && !next.suppressed);
      options = next;
      reset(released);
    },
    reset: restoration,
    dispose() {
      disposed = true;
      cleanups.forEach(cleanup => cleanup());
      resize?.disconnect();
      clearSettle();
      if (frame) win.cancelAnimationFrame(frame);
      if (focusFrame) win.cancelAnimationFrame(focusFrame);
      delete dock.dataset.dockHidden;
      delete dock.dataset.dockReason;
      delete dock.dataset.dockInstant;
    }
  };
}
