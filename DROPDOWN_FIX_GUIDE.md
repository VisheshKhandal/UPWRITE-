# More Dropdown Clipping Fix - Implementation Guide

## Overview

This document details the fix for the "More" dropdown clipping issue in the Write page. The solution implements a floating overlay system that prevents clipping by rendering dropdowns outside the normal document flow.

## Problem Statement

The original "More" dropdown was positioned absolutely within the toolbar container, which could be constrained by:
- Parent container `overflow: hidden`
- Parent container `overflow: auto`
- Fixed-height containers
- Sticky headers

This caused the last menu items to be partially or fully hidden.

## Solution Architecture

### 1. FloatingDropdown Component
**Location:** `client/src/components/ui/FloatingDropdown.tsx`

**Key Features:**
- **Portal Rendering**: Uses React portal to render at `document.body` level
- **Viewport Awareness**: Automatically calculates available space and flips direction
- **Z-Index Management**: Set to 9999 to appear above all editor elements
- **Animation**: Smooth scale (0.95→1) and fade transitions using framer-motion
- **Accessibility**: Proper ARIA attributes, Escape key support, focus management

**API:**
```typescript
<FloatingDropdown
  isOpen: boolean
  onClose: () => void
  triggerRef: React.RefObject<HTMLElement>  // Reference to the trigger button
  children: ReactNode
  align?: "left" | "right" | "center"  // Default: "right"
  minWidth?: string  // Default: "min-w-52"
  className?: string  // Additional container styles
  contentClassName?: string  // Additional wrapper styles
/>
```

**Position Calculation:**
1. Measures available space below and above trigger
2. Determines if there's enough space to open downward
3. Calculates X position based on alignment (right/left/center)
4. Applies viewport margins (16px) to prevent edge overflow
5. Adjusts Y position if dropdown would overflow viewport bottom

### 2. MobileBottomSheet Component
**Location:** `client/src/components/ui/MobileBottomSheet.tsx`

**Key Features:**
- **Mobile-Optimized UI**: Slides up from bottom on mobile devices
- **Swipe Gesture**: Swipe down >100px to close
- **Safe Areas**: Respects `env(safe-area-inset-bottom)` for notched devices
- **Backdrop**: Semi-transparent backdrop with blur effect
- **Body Lock**: Prevents background scrolling when sheet is open
- **Smooth Animation**: Slide-up animation on open, down on close

**API:**
```typescript
<MobileBottomSheet
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string  // Additional content wrapper styles
/>
```

### 3. ResponsiveEditorToolbar Updates
**Location:** `client/src/components/write/ResponsiveEditorToolbar.tsx`

**Changes:**
- Added `isMobile` state detection (breakpoint: 768px)
- Added `moreMenuRef` to track the "More" button position
- Added `closeMenu` utility function
- Replaced old absolute-positioned "More" menu with:
  - `FloatingDropdown` for desktop (≥768px)
  - `MobileBottomSheet` for mobile (<768px)
- Kept fallback absolute positioning for other menus (Headings, Code, Insert)

## Technical Details

### Viewport Positioning Algorithm

```
1. Get trigger button position relative to viewport
2. Calculate available space:
   - spaceBelow = viewport.height - trigger.bottom - OFFSET
   - spaceAbove = trigger.top - OFFSET
3. Estimate dropdown height (use measured or default to 300px)
4. Determine direction:
   - IF spaceBelow >= estimatedHeight: direction = "down"
   - ELSE IF spaceBelow >= spaceAbove: direction = "down"
   - ELSE: direction = "up"
5. Calculate position:
   - IF direction = "down": y = trigger.bottom + OFFSET
   - ELSE: y = trigger.top - estimatedHeight - OFFSET
6. Apply alignment logic:
   - "right": Align right edge to trigger, constrain to viewport
   - "left": Align left edge to trigger, constrain to viewport
   - "center": Center horizontally, constrain to viewport
7. Clamp final position to viewport with margins
```

### Z-Index Hierarchy

```
9999: FloatingDropdown / MobileBottomSheet content
9998: MobileBottomSheet backdrop
50:   Editor toolbar (original)
20:   Editor header (original)
10:   ArticlePublishBar (original)
```

### Animation Specifications

**Open Animation:**
- Duration: 150ms
- Easing: easeOut
- Scale: 0.95 → 1
- Opacity: 0 → 1
- Y offset: -8px (down) / +8px (up) → 0

**Close Animation:**
- Duration: 150ms
- Easing: easeOut (via exit)
- Reverse of open animation

## Mobile Behavior

### Breakpoint: 768px (md breakpoint)

**On Mobile (<768px):**
- More menu opens as bottom sheet
- Occupies up to 90dvh of viewport
- Includes drag handle for discoverability
- Supports swipe-down to close
- Displays title with close button
- Scrollable content area
- Respects safe areas

**On Desktop (≥768px):**
- More menu opens as floating dropdown
- Positioned relative to button
- Auto-flips if insufficient space
- Max-height with internal scroll
- Compact visual design

## Event Handling

### FloatingDropdown Events
- **Click Outside**: Closes dropdown (uses capture phase)
- **Escape Key**: Closes dropdown
- **Resize**: Recalculates position
- **Scroll**: Recalculates position (with capture to catch parent scrolls)

### MobileBottomSheet Events
- **Escape Key**: Closes sheet
- **Backdrop Click**: Closes sheet
- **Swipe Down**: Closes sheet if >100px
- **Touch Start/Move/End**: Handles swipe gesture

## Browser Compatibility

- Modern browsers with React 19+
- Framer Motion 11.15+
- CSS Grid and Flexbox support
- CSS safe-area-inset support (mobile)
- Portal support (React 18+)

## Performance Considerations

1. **Portal Efficiency**: Single portal render at document.body level
2. **Position Recalculation**: Debounced on resize/scroll
3. **Animation Performance**: GPU-accelerated transforms
4. **Memory**: Cleanup listeners on unmount
5. **Reflow/Repaint**: Minimal layout shifts

## Accessibility Features

- **ARIA Attributes**: `aria-expanded`, `aria-label`, `aria-pressed`
- **Keyboard Support**: Escape to close, Tab to navigate items
- **Focus Management**: Returns focus to trigger on close
- **Screen Readers**: Proper button labeling and semantic HTML
- **Mobile Accessibility**: Gesture indicators (drag handle)

## Testing Checklist

### Desktop Testing (≥768px)
- [x] More menu opens as floating dropdown
- [x] Dropdown appears with fade + scale animation
- [x] Dropdown positioned right of button
- [x] Dropdown flips upward when insufficient space below
- [x] Dropdown constrained to viewport edges
- [x] Click outside closes dropdown
- [x] Escape key closes dropdown
- [x] Items are fully visible and clickable
- [x] Button alignment maintained
- [x] Works at 100% and 200% zoom levels

### Mobile Testing (<768px)
- [x] More menu opens as bottom sheet
- [x] Sheet slides up from bottom with animation
- [x] Drag handle visible for UX
- [x] Title and close button displayed
- [x] Swipe down to close gesture works
- [x] All menu items visible without clipping
- [x] Respects safe areas on notched devices
- [x] Backdrop click closes sheet
- [x] Escape key closes sheet
- [x] No page scroll when sheet is open

### Edge Cases
- [x] Very long editor content (long pages)
- [x] Right panel open (reduced viewport width)
- [x] Focus mode active
- [x] Bottom navigation visible
- [x] Multiple dropdowns not interfering
- [x] Menu actions still work after close/reopen
- [x] Responsive resize from desktop to mobile
- [x] Content scrolling within dropdown
- [x] Viewport scrolling doesn't close dropdown
- [x] Position updates on viewport scroll

## Deployment Notes

1. **No Breaking Changes**: Existing toolbar functionality preserved
2. **New Dependencies**: Uses only framer-motion (already installed)
3. **CSS Classes**: Uses Tailwind classes (existing utilities)
4. **Dark Mode**: Full dark mode support with existing dark: prefix
5. **Backward Compatibility**: Other menus still use absolute positioning

## Future Enhancements

1. **Floating UI Library**: Consider for more complex positioning scenarios
2. **Animation Customization**: Allow custom animation props
3. **Nested Menus**: Support submenu interactions
4. **Keyboard Navigation**: Full arrow key navigation
5. **Touch-Friendly Sizing**: Larger touch targets on mobile

## Debugging Tips

1. **DevTools**: Inspect portal elements in document.body
2. **Position**: Use browser DevTools to verify calculated position
3. **Z-Index**: Use "Inspect - Paint flashing" to verify stacking
4. **Animation**: Use Firefox DevTools animation inspector
5. **Viewport**: Test with responsive design mode (F12)

## References

- React Portal: https://react.dev/reference/react-dom/createPortal
- Framer Motion: https://www.framer.com/motion/
- CSS Safe Areas: https://caniuse.com/css-env
- Viewport Events: https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent
