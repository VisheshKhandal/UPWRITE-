# Scroll-aware navigation

The global Today / Read / Library / Learn capsule and Create button move as one
dock. The article reader uses the same controller for its separate tools bar;
article routes do not render the global dock. Reading Focus still removes its
toolbar explicitly. Desktop sidebars retain their existing behavior.

## Final tuning

These values incorporate the requested slower motion:

| Setting | Value |
| --- | --- |
| Always visible near the top | First 48px |
| Accumulated downward movement before hiding | 48px |
| Accumulated upward movement before revealing | 10px |
| Ignored positional noise | Less than 2px |
| Real bottom tolerance | 2px |
| Bottom-only settling fallback | 160ms after the last scroll event |
| Dock hide / reveal | 700ms / 420ms |
| Mobile active highlight slide | 500ms |
| Mobile label and icon colors | 420ms |
| New page / ordinary article entrance | 560ms |

Motion uses the existing standard in/out easing `(0.4, 0, 0.2, 1)` without bounce.
The active highlight is one persistent element, so selecting another tab during
its slide redirects it from its current position. Navigation is immediate; there
is no added loading delay. Existing route preloads and Suspense fallbacks remain.

## Implementation

- `client/src/motion/scrollAwareDock.ts`: directional accumulation, clamping,
  boundary latching, input intent, explicit suppression priorities, focus and
  pointer pinning, keyboard signals, observers and listener cleanup.
- `client/src/motion/useScrollAwareDock.ts`: React lifecycle integration. Scroll
  coordinates stay outside React state; only the dock's attributes change.
- `client/src/components/layout/MobileNav.tsx`: coordinated global dock, Create
  pinning, persistent active highlight and native navigation semantics.
- `client/src/pages/articles/ArticleDetailPage.tsx`: reader toolbar and existing
  modal/Focus policy integration.
- `client/src/motion/MotionProvider.tsx`, `system.ts`, and
  `client/src/components/article/useReaderProgress.ts`: page motion and explicit
  restoration/programmatic-scroll resets.
- `client/src/motion/overlays.tsx` and
  `client/src/components/layout/TopBar.tsx`: shared modal lock notification,
  including the native mobile search dialog.
- `client/src/styles/index.css` and `client/src/layouts/AppLayout.tsx`:
  transform-only sliding, motion tokens, safe-area clearance, stable padding,
  hidden pointer handling, and reduced-motion/focus overrides.
- `client/tests/scrollAwareDock.test.mjs`: deterministic direction, policy and
  browser-binding tests, including a focus-release regression that previously
  could leave instant motion enabled.

## Scroll owners and accessibility

App reading/list routes and articles use the window. Nested sheet, notebook,
code/table and other independently scrollable regions do not supply page input
intent. The writing workspace has independent textarea, preview and sidebar
scroll owners: its dock deliberately stays visible, subject to modal/keyboard
suppression.

Dock controls keep their native tab order and accessible names. Tab reveals the
dock synchronously, before focus moves. Focus within it pins it; a focused
control is never translated offscreen. Hidden controls cannot intercept pointer
events. Focus and pointer release discard movement accumulated while pinned,
and remove the temporary instant-motion override. Reduced-motion users keep a
visible dock except for explicit Focus, modal or keyboard policy.

## Verification

- 26 dock tests and 8 existing reader tests passed.
- Type checking and production builds passed during implementation. The build
  reports the existing bundle-size advisory for chunks over 500kB. No lint
  script is provided by the client package.
- The running app was inspected at 320px, 390px and 768px, in light/dark themes,
  including enlarged reader text, Create, search modal suppression, reader
  Contents/hash navigation, Notebook draft entry, appearance and Focus entry/exit.
- Browser samples confirmed progressive dock movement through intermediate
  offsets with the final 700ms duration; the persistent highlight moved through
  intermediate tab positions. Computed page opacity increased progressively
  during navigation. Document height stayed constant when hiding the dock.

The browser's scroll command behaves as programmatic scrolling, so intentional
browser scroll checks used PageDown/ArrowUp input. Touch/wheel intent, momentum,
overscroll, viewport keyboard signals, geometry changes, and Strict Mode-style
detach/reattach cleanup are covered by the deterministic harness. They are not
physical-device checks. Safari rubber-banding, real iOS/Android keyboards,
standalone PWA keyboard behavior, screen-reader behavior and system text zoom
still need device verification. History/Resume policies were preserved; full
authenticated Continue-reading and pagination flows were not exercised end to end.
