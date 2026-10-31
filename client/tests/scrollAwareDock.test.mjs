import test from 'node:test';
import assert from 'node:assert/strict';
import { DockDirection, DOCK_SCROLL, dockVisibility, keyboardOccupiesBottom, attachScrollAwareDock, DOCK_RESET_EVENT, DOCK_MODAL_EVENT } from '../src/motion/scrollAwareDock.ts';

const policy = { suppressed: false, keyboard: false, pinned: false, reducedMotion: false, autoHide: true };
const directionAt = (position = 100, maximum = 1000) => { const d = new DockDirection(); d.reset(position, maximum); return d; };

test('48px downward hides; 10px upward promptly reveals', () => {
  const d = directionAt(); d.move(146, true); assert.equal(d.hidden, false);
  d.move(148, true); assert.equal(d.hidden, true);
  d.move(140, true); assert.equal(d.hidden, true);
  d.move(138, true); assert.equal(d.hidden, false);
});
test('alternating subpixel noise does not hide; slow same-direction movement accumulates', () => {
  const d = directionAt();
  for (let i = 0; i < 100; i++) { d.move(101, true); d.move(99, true); }
  assert.equal(d.hidden, false);
  for (let p = 101; p <= 148; p += 0.5) d.move(p, true);
  assert.equal(d.hidden, true);
});
test('meaningful reversals reset directional accumulation', () => {
  const d = directionAt(); d.move(145, true); d.move(140, true); d.move(185, true);
  assert.equal(d.hidden, false); d.move(188, true); assert.equal(d.hidden, true);
  d.move(180, true); d.move(183, true); d.move(175, true); assert.equal(d.hidden, true);
  d.move(173, true); assert.equal(d.hidden, false);
});
test('near top, zero range and short pages remain visible', () => {
  for (const max of [0, 20, 48, 1000]) {
    const d = directionAt(0, max); d.move(45, true);
    assert.equal(dockVisibility(policy, d.hidden, d.boundary).hidden, false);
  }
  const d = directionAt(); d.move(200, true); d.move(40, true);
  assert.equal(d.hidden, false); assert.equal(d.boundary, true);
});
test('fast fling reaches bottom hidden, then settles visible and stays latched', () => {
  const d = directionAt(); d.move(980, true); assert.equal(d.hidden, true);
  d.settle(); assert.equal(d.hidden, true); // 20px from end is not the end
  d.move(1000, true); assert.equal(d.hidden, true);
  d.settle(); assert.equal(d.hidden, false);
  for (let i = 0; i < 10; i++) { d.move(995, true); d.move(1200, true); }
  assert.equal(d.hidden, false);
  d.move(900, true); d.move(950, true); assert.equal(d.hidden, true);
});
test('negative and excessive overscroll clamp without false reversals', () => {
  const d = directionAt(0); d.move(-100, true); assert.equal(d.position, 0);
  d.move(40, true); assert.equal(d.hidden, false);
  d.move(5000, true); assert.equal(d.position, 1000); assert.equal(d.hidden, true);
  d.move(1100, true); assert.equal(d.hidden, true);
  d.move(990, true); assert.equal(d.hidden, false);
});
test('ordinary idle retains hidden state; restoration clears direction and old distance', () => {
  const d = directionAt(); d.move(148, true); d.settle(); assert.equal(d.hidden, true);
  d.reset(500, 1000); assert.equal(d.hidden, false);
  d.move(545, true); assert.equal(d.hidden, false);
  d.move(548, true); assert.equal(d.hidden, true);
  d.move(800, false); assert.equal(d.hidden, true);
  d.reset(800, 1000); assert.equal(d.hidden, false);
});
test('suppression, keyboard, interaction, reduced motion and boundaries have explicit priority', () => {
  assert.deepEqual(dockVisibility({ ...policy, pinned: true }, true, false), { hidden: false, reason: 'interaction' });
  assert.deepEqual(dockVisibility({ ...policy, pinned: true, keyboard: true }, false, true), { hidden: true, reason: 'keyboard' });
  assert.deepEqual(dockVisibility({ ...policy, pinned: true, reducedMotion: true, keyboard: true, suppressed: true }, false, true), { hidden: true, reason: 'suppressed' });
  assert.equal(dockVisibility({ ...policy, reducedMotion: true }, true, false).hidden, false);
  assert.equal(dockVisibility({ ...policy, autoHide: false }, true, false).hidden, false);
});
test('keyboard needs edit focus and large occlusion, excludes chrome, rotation and zoom', () => {
  const input = { editable: true, baseline: 800, height: 480, scale: 1, widthChanged: false };
  assert.equal(keyboardOccupiesBottom(input), true);
  for (const change of [{ editable: false }, { height: 720 }, { scale: 1.4 }, { widthChanged: true }]) {
    assert.equal(keyboardOccupiesBottom({ ...input, ...change }), false);
  }
});

// A deterministic DOM/event harness exercises the actual browser binding,
// including scheduling and cleanup. It does not simulate a device keyboard.
class Target {
  handlers = new Map();
  addEventListener(name, callback) { if (!this.handlers.has(name)) this.handlers.set(name, new Set()); this.handlers.get(name).add(callback); }
  removeEventListener(name, callback) { this.handlers.get(name)?.delete(callback); }
  emit(name, event = {}) { for (const callback of this.handlers.get(name) ?? []) callback({ target: this, ...event }); }
  get count() { return [...this.handlers.values()].reduce((n, set) => n + set.size, 0); }
}
class ElementStub extends Target {
  dataset = {}; style = {}; parentElement = null; scrollHeight = 0; clientHeight = 0; scrollWidth = 0; clientWidth = 0;
  editable = false; nested = false;
  contains(el) { return el === this || el?.parentElement === this; }
  matches() { return this.editable; }
  hasAttribute() { return false; }
  closest() { return this.nested ? this : null; }
}
globalThis.Element = ElementStub;
const observers = new Set();
globalThis.ResizeObserver = class {
  constructor(callback) { this.callback = callback; observers.add(this); }
  observe() {}
  disconnect() { observers.delete(this); }
};
function harness(options = {}) {
  const win = new Target(); const doc = new Target(); const dock = new ElementStub(); const body = new ElementStub();
  const timers = new Map(), frames = new Map(); let id = 0;
  Object.assign(win, { scrollY: 100, innerHeight: 800, innerWidth: 390, visualViewport: Object.assign(new Target(), { height: 800, scale: 1 }),
    setTimeout: callback => { timers.set(++id, callback); return id; }, clearTimeout: id => timers.delete(id),
    requestAnimationFrame: callback => { frames.set(++id, callback); return id; }, cancelAnimationFrame: id => frames.delete(id),
    getComputedStyle: el => ({ overflowY: el.nested ? 'auto' : 'visible', overflowX: 'visible' }) });
  Object.assign(doc, { body, documentElement: { scrollHeight: 1800 }, activeElement: body });
  const controller = attachScrollAwareDock(dock, { ...policy, ...options }, win, doc);
  const frame = () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn()); };
  const settle = () => { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(fn => fn()); };
  const scroll = y => { win.scrollY = y; win.emit('scroll'); frame(); };
  const wheel = (y, target = body) => { win.emit('wheel', { target }); scroll(y); };
  return { win, doc, dock, body, controller, frame, settle, scroll, wheel, frames, timers };
}
test('binding uses page intent, ignores programmatic movement and nested input', () => {
  const h = harness(); h.scroll(300); assert.equal(h.dock.dataset.dockHidden, 'false');
  h.wheel(348); assert.equal(h.dock.dataset.dockHidden, 'true');
  h.settle(); assert.equal(h.dock.dataset.dockHidden, 'true');
  h.wheel(338); assert.equal(h.dock.dataset.dockHidden, 'false');
  const nested = new ElementStub(); nested.nested = true;
  h.wheel(500, nested); assert.equal(h.dock.dataset.dockHidden, 'false'); h.controller.dispose();
});
test('small separate same-direction gestures accumulate across idle', () => {
  const h = harness();
  for (const y of [108, 116, 124, 132, 140]) { h.wheel(y); h.settle(); assert.equal(h.dock.dataset.dockHidden, 'false'); }
  h.wheel(148); assert.equal(h.dock.dataset.dockHidden, 'true'); h.controller.dispose();
});
test('bottom reveal waits for last fling event, does not reopen at arbitrary idle', () => {
  const h = harness(); h.wheel(900); h.settle(); assert.equal(h.dock.dataset.dockHidden, 'true');
  h.wheel(1000); assert.equal(h.dock.dataset.dockHidden, 'true');
  assert.equal(h.timers.size, 1); h.settle(); assert.equal(h.dock.dataset.dockHidden, 'false'); h.controller.dispose();
});
test('Create-menu pinning overrides scrolling, but a modal overrides the menu', () => {
  const h = harness({ pinned: true }); h.wheel(300); assert.equal(h.dock.dataset.dockHidden, 'false');
  h.win.emit(DOCK_MODAL_EVENT, { detail: true }); assert.equal(h.dock.dataset.dockHidden, 'true');
  h.wheel(250); assert.equal(h.dock.dataset.dockHidden, 'true');
  h.win.emit(DOCK_MODAL_EVENT, { detail: false }); assert.equal(h.dock.dataset.dockHidden, 'false'); h.controller.dispose();
});
test('press and drag remain pinned until release outside dock', () => {
  const h = harness(); h.doc.emit('pointerdown', { target: h.dock, pointerId: 1 });
  h.wheel(300); assert.equal(h.dock.dataset.dockHidden, 'false');
  h.win.emit('pointerup', { pointerId: 1 }); assert.equal(h.dock.dataset.dockHidden, 'false');
  h.wheel(348); assert.equal(h.dock.dataset.dockHidden, 'true'); h.controller.dispose();
});
test('Tab reveals synchronously and focus pins; focused controls never slide away', () => {
  const h = harness(); h.wheel(300); assert.equal(h.dock.dataset.dockHidden, 'true');
  h.doc.emit('keydown', { key: 'Tab' }); assert.equal(h.dock.dataset.dockHidden, 'false');
  assert.equal(h.dock.dataset.dockInstant, 'true');
  h.doc.activeElement = h.dock; h.doc.emit('focusin'); h.wheel(500);
  assert.equal(h.dock.dataset.dockHidden, 'false');
  h.win.emit(DOCK_MODAL_EVENT, { detail: true }); assert.equal(h.dock.dataset.dockHidden, 'false');
  h.doc.activeElement = h.body; h.doc.emit('focusout'); h.frame();
  assert.equal(h.dock.dataset.dockHidden, 'true'); h.controller.dispose();
});
test('keyboard suppresses even a pinned dock; close resets baseline without a jump', () => {
  const h = harness({ pinned: true }); const input = new ElementStub(); input.editable = true;
  h.doc.activeElement = input; h.doc.emit('focusin');
  h.win.visualViewport.height = 450; h.win.visualViewport.emit('resize');
  assert.equal(h.dock.dataset.dockReason, 'keyboard'); assert.equal(h.dock.dataset.dockHidden, 'true');
  h.wheel(300); assert.equal(h.dock.dataset.dockHidden, 'true');
  h.win.visualViewport.height = 800; h.win.visualViewport.emit('resize');
  assert.equal(h.dock.dataset.dockHidden, 'false'); h.controller.dispose();
});
test('Android layout resize fallback and rotation keep an existing keyboard suppressed', () => {
  const h = harness(); const input = new ElementStub(); input.editable = true;
  h.doc.activeElement = input; h.doc.emit('focusin');
  h.win.visualViewport = null; h.win.innerHeight = 450; h.win.emit('resize');
  assert.equal(h.dock.dataset.dockReason, 'keyboard');
  h.win.innerWidth = 844; h.win.innerHeight = 190; h.win.emit('resize');
  assert.equal(h.dock.dataset.dockHidden, 'true');
  h.win.emit('resize'); assert.equal(h.dock.dataset.dockHidden, 'true');
  h.win.innerHeight = 390; h.win.emit('resize'); assert.equal(h.dock.dataset.dockHidden, 'false');
  h.controller.dispose();
});
test('browser chrome collapse and pinch zoom do not open a keyboard policy', () => {
  const h = harness(); const input = new ElementStub(); input.editable = true;
  h.doc.activeElement = input; h.doc.emit('focusin');
  h.win.visualViewport.height = 720; h.win.visualViewport.emit('resize');
  assert.notEqual(h.dock.dataset.dockReason, 'keyboard');
  h.win.visualViewport.height = 400; h.win.visualViewport.scale = 2; h.win.visualViewport.emit('resize');
  assert.notEqual(h.dock.dataset.dockReason, 'keyboard'); h.controller.dispose();
});
test('route and restoration reset pending samples and accumulated distances', () => {
  const h = harness(); h.wheel(200); assert.equal(h.dock.dataset.dockHidden, 'true');
  h.win.scrollY = 600; h.win.emit(DOCK_RESET_EVENT); assert.equal(h.dock.dataset.dockHidden, 'false');
  h.scroll(700); assert.equal(h.dock.dataset.dockHidden, 'false');
  h.wheel(745); assert.equal(h.dock.dataset.dockHidden, 'false');
  h.wheel(748); assert.equal(h.dock.dataset.dockHidden, 'true');
  h.controller.dispose();
});
test('geometry changes rebaseline dynamic loading and orientation without flicker', () => {
  const h = harness(); h.wheel(300); assert.equal(h.dock.dataset.dockHidden, 'true');
  h.doc.documentElement.scrollHeight = 2800;
  for (const observer of observers) observer.callback();
  h.scroll(320); assert.equal(h.dock.dataset.dockHidden, 'true');
  h.win.innerWidth = 800; h.win.innerHeight = 390; h.win.visualViewport.height = 390; h.win.emit('resize');
  assert.equal(h.dock.dataset.dockHidden, 'true'); assert.notEqual(h.dock.dataset.dockReason, 'keyboard');
  h.wheel(310); assert.equal(h.dock.dataset.dockHidden, 'false'); h.controller.dispose();
});
test('closing Create releases to a visible fresh baseline; later scrolling can hide again', () => {
  const h = harness({ pinned: true }); h.wheel(300);
  h.controller.update(policy); assert.equal(h.dock.dataset.dockHidden, 'false');
  h.wheel(348); assert.equal(h.dock.dataset.dockHidden, 'true'); h.controller.dispose();
});
test('a pointer gesture restores animated motion after a keyboard reveal', () => {
  const h = harness(); h.doc.emit('keydown', { key: 'Tab' });
  assert.equal(h.dock.dataset.dockInstant, 'true'); h.wheel(300);
  assert.equal(h.dock.dataset.dockInstant, undefined); assert.equal(h.dock.dataset.dockHidden, 'true'); h.controller.dispose();
});
test('leaving dock focus removes instant motion and discards movement accumulated while pinned', () => {
  const h = harness(); h.doc.activeElement = h.dock; h.doc.emit('focusin');
  h.wheel(300); assert.equal(h.dock.dataset.dockHidden, 'false');
  assert.equal(h.dock.dataset.dockInstant, 'true');
  h.doc.activeElement = h.body; h.doc.emit('focusout'); h.frame();
  assert.equal(h.dock.dataset.dockInstant, undefined);
  assert.equal(h.dock.dataset.dockHidden, 'false');
  h.wheel(330); assert.equal(h.dock.dataset.dockHidden, 'false');
  h.wheel(348); assert.equal(h.dock.dataset.dockHidden, 'true'); h.controller.dispose();
});
test('a short downward reading gesture no longer dismisses the dock immediately', () => {
  const h = harness();
  h.wheel(130); h.settle(); assert.equal(h.dock.dataset.dockHidden, 'false');
  h.wheel(120); assert.equal(h.dock.dataset.dockHidden, 'false');
  h.wheel(150); assert.equal(h.dock.dataset.dockHidden, 'false');
  h.wheel(168); assert.equal(h.dock.dataset.dockHidden, 'true'); h.controller.dispose();
});
test('reduced motion stays visible, except for explicit modal policy', () => {
  const h = harness({ reducedMotion: true }); h.wheel(300); assert.equal(h.dock.dataset.dockHidden, 'false');
  h.win.emit(DOCK_MODAL_EVENT, { detail: true }); assert.equal(h.dock.dataset.dockHidden, 'true'); h.controller.dispose();
});
test('all listeners, observers, frames and timers clean up; Strict Mode reattach is safe', () => {
  const h = harness(); h.win.emit('scroll'); h.doc.emit('focusout');
  assert.ok(h.frames.size); assert.ok(h.timers.size);
  h.controller.dispose();
  assert.equal(h.win.count + h.doc.count + h.win.visualViewport.count, 0);
  assert.equal(h.frames.size + h.timers.size + observers.size, 0);
  assert.equal(h.dock.dataset.dockHidden, undefined);
  const second = attachScrollAwareDock(h.dock, policy, h.win, h.doc);
  h.wheel(200); assert.equal(h.dock.dataset.dockHidden, 'true'); second.dispose();
  assert.equal(h.win.count + h.doc.count + h.win.visualViewport.count, 0);
});
