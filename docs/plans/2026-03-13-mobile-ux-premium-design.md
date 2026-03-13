# Mobile UX Premium Redesign

**Date:** 2026-03-13
**Approach:** Progressive Enhancement (mobile layer on top of existing desktop)
**Goal:** Premium mobile-first experience without breaking desktop

---

## Context

The app is desktop-first. Mobile has no dedicated navigation, tables are unusable on small screens, and there are no touch-optimized interactions. Users need a mix of consultation (checking status, deadlines on the go) and occasional actions (creating assets, managing portfolios).

## Navigation

### Mobile Header (< 768px)

Replace the desktop nav pills with a simplified header:
- Logo + org name on the left
- Notification bell + user avatar on the right
- `sticky top-0 z-40`
- Glass effect: `backdrop-blur-xl bg-white/80`
- Desktop nav pills hidden via `hidden md:flex`

### Bottom Tab Bar

5 tabs fixed at the bottom:
1. Home (`/dashboard`)
2. Assets (`/assets`)
3. Deadlines (`/deadlines`)
4. Portfolios (`/portfolios`)
5. More (opens bottom sheet)

Implementation:
- `fixed bottom-0 z-40` with `backdrop-blur-xl bg-white/80 border-t`
- Height: `h-16` + `pb-[env(safe-area-inset-bottom)]` for iPhone safe area
- Icons 24px, labels 10px below
- Active tab: `primary-600` color + scale animation
- Hidden on desktop: `md:hidden`

### Bottom Sheet "More"

Triggered by "More" tab. Contains:
- Renewals (`/renewal-decisions`)
- Documents (`/documents`)
- Settings (`/settings`)

Implementation:
- Overlay `bg-black/30` with fade animation
- Sheet: `rounded-t-2xl`, slide-up spring animation
- Glass effect: `backdrop-blur-xl bg-white/90`
- Grab handle (centered gray bar)
- Items with `min-h-[48px]` touch targets

### Content Spacing

- `main` receives `pb-20 md:pb-0` to compensate for tab bar
- Global padding: `px-4 md:px-6`

---

## Cards & Data Display

### SwipeableCard

Replaces table rows on mobile for asset lists:
- `rounded-xl border bg-white shadow-card p-4`
- Line 1: Title (font-medium, truncated)
- Line 2: Country flag + type + dot separator + status badge
- Line 3: Owner + date (right-aligned) + chevron
- Tap navigates to detail page

Swipe-to-reveal actions (swipe left):
- 3 vertical colored buttons: Change Status (blue), Add to Portfolio (indigo), View (neutral)
- Each button: `w-20`, icon + small label
- Spring rubber band effect if swiped too far
- Threshold: 80px to reveal, max 160px

### Card Animations

Stagger appearance:
- 80ms delay between each card
- `opacity 0->1` + `translateY(12px->0)` + `scale(0.98->1)`
- Duration: 400ms with spring easing

### Mobile Asset List

- Search input full width
- Filter pills: `overflow-x-auto scrollbar-hide` (horizontal scroll)
- Dropdown filters: `grid-cols-2`
- Pull-to-refresh with circular spinner indicator

### Selection & Bulk Actions

- Long press on card enters selection mode
- Checkbox appears top-left of each card
- Simplified bulk bar replaces tab bar temporarily
- Single "Actions..." dropdown opens bottom sheet with options

### Dashboard Recent Assets

Compact list items (not full cards):
- Title + chevron on line 1
- Flag + type + status badge + date on line 2
- Separated by borders, tap to navigate

---

## Dashboard Mobile Layout

### Section Order (mobile via Tailwind `order-`)

1. Portfolio Health (synthetic overview first)
2. Asset Tracker stats
3. For You Today (urgent actions)
4. Recent Assets (consultation)

Desktop order unchanged (2-column grid).

### Stats Grid

Keep `grid-cols-3` on mobile but reduce sizes:
- Values: `text-2xl` instead of `text-3xl`
- Padding: `px-3 py-3` instead of `px-5 py-4`

### Portfolio Health

Full width on mobile (not sidebar). Moves above asset tracker.

### For You Today

- Touch targets: `min-h-[48px]` per item
- Review button: `px-4 py-2` instead of `px-3 py-1`

---

## Design System Additions

### New Tokens (`tokens.css`)

```css
/* Mobile */
--space-safe-bottom: env(safe-area-inset-bottom);
--header-height: 3.5rem;
--tab-bar-height: 4rem;

/* Premium shadows */
--shadow-card: 0 1px 3px rgb(0 0 0 / 0.04), 0 4px 12px rgb(0 0 0 / 0.03);
--shadow-card-hover: 0 2px 8px rgb(0 0 0 / 0.06), 0 8px 24px rgb(0 0 0 / 0.04);
--shadow-elevated: 0 4px 16px rgb(0 0 0 / 0.08), 0 12px 40px rgb(0 0 0 / 0.06);

/* Glass */
--backdrop-blur: 20px;
--glass-bg: rgb(255 255 255 / 0.8);
--glass-bg-dark: rgb(255 255 255 / 0.9);

/* Spring easing */
--ease-spring: cubic-bezier(0.22, 1, 0.36, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);

/* Durations */
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;

/* Touch */
--touch-target-min: 44px;
```

### New Animations (`animations.css`)

- `card-enter-mobile`: opacity + translateY + scale with stagger
- `sheet-up`: translateY(100%) -> 0 for bottom sheets
- `tab-tap`: scale 1 -> 0.85 -> 1 for tab bar icons
- `pull-spin`: rotate for pull-to-refresh
- `fade-in`: opacity 0 -> 1 for overlays

### New UI Components (`packages/ui/src/`)

| Component | Category | Purpose |
|-----------|----------|---------|
| BottomTabBar | organisms | 5-tab navigation, glass effect |
| BottomSheet | organisms | Slide-up modal with grab handle |
| SwipeableCard | molecules | Card with swipe-to-reveal actions |
| MobileHeader | molecules | Simplified header (logo + actions) |
| PullToRefresh | atoms | Pull-down gesture wrapper |
| GlassBar | atoms | Backdrop-blur container |

### Svelte Action: `swipeable`

New action in `apps/web/src/lib/animations/`:
- Detects horizontal swipe via touch events
- Exposes swipe distance reactively
- Reveal threshold: 80px, rubber band at 160px
- Callbacks: `onreveal` / `onhide`

---

## Page-by-Page Adaptations

### Assets Page
- Header: title full width, action buttons on separate row below
- "Export CSV" hidden in overflow menu (bottom sheet)
- Stats: `grid-cols-2` on mobile
- Table replaced by SwipeableCard stack
- New Asset drawer becomes bottom sheet on mobile

### Portfolios
- Cards: `grid-cols-1` on mobile
- `active:scale-[0.97]` on cards

### Deadlines
- Cards with colored left border for priority
- Overdue items at top with red accent

### Renewal Decisions
- Cards with visible score gauge
- Renew/Abandon as full-width buttons in card

### Documents
- `grid-cols-1` cards with file type icon
- Swipe for download/delete

### Settings
- Stacked cards, toggle switches with 48px touch targets

### Asset Detail
- Tabs in horizontal scroll
- Metadata in single column
- Actions in header or FAB

---

## Transversal Patterns

| Pattern | Implementation |
|---------|---------------|
| Mobile padding | `px-4 md:px-6` |
| Touch targets | `min-h-[var(--touch-target-min)]` |
| Active feedback | `active:scale-[0.97]` with spring ease |
| Card shadows | `shadow-card` -> `shadow-card-hover` on touch |
| Safe area | `pb-[calc(var(--tab-bar-height)+var(--space-safe-bottom))]` |
| Page transitions | spring curve easing |
| Horizontal scroll | `overflow-x-auto scrollbar-hide` for filter pills |
