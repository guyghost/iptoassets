# IPMS UX/UI & Motion Design Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the IPMS into a polished, modern hybrid-corporate experience with functional animations, improved information hierarchy, and a cohesive design system.

**Direction:** Hybrid — corporate structure with modern SaaS accents (Vercel/Raycast spirit).

---

## Part 1: UX Audit — Current Pain Points

### 1.1 Information Overload
- **Asset detail page** dumps every metadata field in flat grids. No progressive disclosure — users see 50+ fields at once with equal visual weight.
- **Dashboard stats** are static numbers with no context (no trends, no sparklines, no comparison to previous period).
- **Deadlines page** is a flat list with no urgency hierarchy beyond border colors.

### 1.2 Lack of Visual Hierarchy
- All cards use identical styling (`rounded-2xl border bg-white p-6 shadow-sm`). A KPI card looks the same as an info card.
- No differentiation between "glanceable" and "deep-dive" content.
- Status badges use subtle color tints that require careful reading.

### 1.3 Missing Feedback & State Communication
- No loading skeletons — content jumps in after fetch.
- No empty state illustrations (just text).
- No transition when navigating between pages.
- No visual confirmation when completing a deadline or changing a status.
- Filter changes trigger a full reload with no indication of what changed.

### 1.4 Navigation Gaps
- No breadcrumbs on detail pages (just a "Back" link).
- No quick actions from the dashboard (e.g., mark deadline done, view expiring asset).
- Search bar on dashboard is decorative — not connected.
- No keyboard shortcuts.

### 1.5 Missed Opportunities
- Portfolio Health is buried in the right column — should be a hero element.
- No risk visualization (assets approaching expiration, overdue deadlines).
- No activity feed or recent changes.
- Documents and Deadlines pages feel disconnected from their parent assets.

---

## Part 2: Architecture UX des Pages Cle

### 2.1 Dashboard (Hero Page)

```
+------------------------------------------------------------------+
| TOP NAV (existing, unchanged)                                     |
+------------------------------------------------------------------+
| HERO GRADIENT SECTION                                             |
|   [Title + Subtitle]                                              |
|   [Type Chips] [Status Dropdown] [Region Dropdown]                |
+------------------------------------------------------------------+
| RISK BANNER (conditional — only if urgent items exist)            |
|   "3 assets expiring in 30 days  ·  2 overdue deadlines"  [View] |
+------------------------------------------------------------------+
| KPI ROW (4 cards, equal width)                                    |
|   [Total Assets]  [Granted]  [Expiring Soon]  [Health Score]      |
|   sparkline       sparkline   countdown        circular gauge     |
+------------------------------------------------------------------+
| TWO-COLUMN GRID                                                   |
|  LEFT (60%)                    | RIGHT (40%)                      |
|  +---------------------------+ | +------------------------------+ |
|  | Recent Assets (table)     | | | For You Today (deadlines)    | |
|  | - clickable rows          | | | - checkable items            | |
|  | - inline status badges    | | | - urgency color coding       | |
|  | - "View all" link         | | | - "View all" link            | |
|  +---------------------------+ | +------------------------------+ |
|                                | +------------------------------+ |
|  +---------------------------+ | | Activity Feed                | |
|  | Portfolio Distribution    | | | - recent status changes      | |
|  | - horizontal stacked bar  | | | - new assets added           | |
|  | - type breakdown legend   | | | - deadlines completed        | |
|  +---------------------------+ | +------------------------------+ |
+------------------------------------------------------------------+
```

**Hierarchy:**
1. Risk Banner (red/amber) — immediate attention
2. KPI Row — portfolio health at a glance
3. Recent Assets — what changed
4. Deadlines — what to do next
5. Distribution + Activity — context

### 2.2 Asset Detail (Redesigned)

```
+------------------------------------------------------------------+
| BREADCRUMB: Dashboard > Assets > [Asset Title]                    |
+------------------------------------------------------------------+
| HEADER BAR                                                        |
|   [Flag] [Title]                    [Status Badge]  [Actions v]   |
|   Patent · US · Filed Dec 2024                                    |
+------------------------------------------------------------------+
| TAB NAV: Overview | Documents | Timeline | Related                |
+------------------------------------------------------------------+
| OVERVIEW TAB (default)                                            |
|  +---------------------------+ +--------------------------------+ |
|  | Key Details Card          | | Status & Actions Card          | |
|  | Filing Date, Expiration,  | | Current: Filed                 | |
|  | Owner, Jurisdiction       | | Next: [Publish] [Abandon]      | |
|  | Priority indicator        | | Timeline (compact vertical)    | |
|  +---------------------------+ +--------------------------------+ |
|  +--------------------------------------------------------------+ |
|  | Patent Information (collapsible sections)                     | |
|  |   > Applications (table)                                     | |
|  |   > Publications (table)                                     | |
|  |   > Classifications (IPC/CPC tags)                           | |
|  |   > Citations (summary + expandable)                         | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

**Key changes:**
- Tab navigation instead of endless scroll
- Collapsible sections for progressive disclosure
- Status + actions grouped in a dedicated card (right column)
- Breadcrumbs for orientation

### 2.3 Pipeline View (Deadlines Redesign)

```
+------------------------------------------------------------------+
| HERO SECTION                                                      |
|   [Title]  [Filters: Type, Priority]                              |
+------------------------------------------------------------------+
| KANBAN-STYLE COLUMNS (horizontal scroll on mobile)                |
|  +---------------+ +---------------+ +---------------+            |
|  | OVERDUE (3)   | | THIS WEEK (5) | | UPCOMING (12) |            |
|  | red header    | | amber header  | | blue header   |            |
|  |               | |               | |               |            |
|  | [Deadline]    | | [Deadline]    | | [Deadline]    |            |
|  | [Deadline]    | | [Deadline]    | | [Deadline]    |            |
|  | [Deadline]    | | [Deadline]    | | [Deadline]    |            |
|  +---------------+ +---------------+ +---------------+            |
+------------------------------------------------------------------+
| COMPLETED SECTION (collapsible)                                   |
|   [Completed deadline] [Completed deadline] ...                   |
+------------------------------------------------------------------+
```

**Key changes:**
- Kanban columns by urgency (visual weight by color)
- Deadline cards show: title, asset name, due date, type badge
- Quick-complete checkbox on each card
- Completed section collapsed by default

### 2.4 Reports / Insights View (New Page)

```
+------------------------------------------------------------------+
| HERO SECTION                                                      |
|   "Portfolio Insights"  [Date range picker]  [Export PDF]         |
+------------------------------------------------------------------+
| SUMMARY ROW                                                       |
|  [Total Value] [Growth %] [Risk Score] [Coverage %]               |
+------------------------------------------------------------------+
| CHARTS GRID (2x2)                                                 |
|  +---------------------------+ +--------------------------------+ |
|  | Assets by Type (donut)    | | Status Distribution (bar)      | |
|  +---------------------------+ +--------------------------------+ |
|  +---------------------------+ +--------------------------------+ |
|  | Expiration Timeline       | | Jurisdiction Map               | |
|  | (area chart, 12 months)   | | (choropleth or bubble)         | |
|  +---------------------------+ +--------------------------------+ |
+------------------------------------------------------------------+
| ALERTS TABLE                                                      |
|   [Assets requiring attention — sorted by urgency]                |
+------------------------------------------------------------------+
```

---

## Part 3: Design System (JSON)

```json
{
  "designSystem": {
    "name": "IPMS Hybrid",
    "version": "2.0",

    "colors": {
      "background": {
        "page": "#f7f7f8",
        "surface": "#ffffff",
        "surfaceElevated": "#ffffff",
        "hero": "linear-gradient(to bottom, #f0ecff, #f7f7f8)",
        "dark": "#2d1b69",
        "darkSubtle": "#1e1245"
      },
      "primary": {
        "50": "#eff6ff",
        "100": "#dbeafe",
        "200": "#bfdbfe",
        "300": "#93c5fd",
        "400": "#60a5fa",
        "500": "#3b82f6",
        "600": "#2563eb",
        "700": "#1d4ed8"
      },
      "neutral": {
        "50": "#f8fafc",
        "100": "#f1f5f9",
        "200": "#e2e8f0",
        "300": "#cbd5e1",
        "400": "#94a3b8",
        "500": "#64748b",
        "600": "#475569",
        "700": "#334155",
        "800": "#1e293b",
        "900": "#0f172a"
      },
      "status": {
        "draft":     { "bg": "#f1f5f9", "text": "#475569", "border": "#e2e8f0" },
        "filed":     { "bg": "#eff6ff", "text": "#1d4ed8", "border": "#bfdbfe" },
        "published": { "bg": "#eef2ff", "text": "#4338ca", "border": "#c7d2fe" },
        "granted":   { "bg": "#f0fdf4", "text": "#15803d", "border": "#bbf7d0" },
        "expired":   { "bg": "#fffbeb", "text": "#b45309", "border": "#fde68a" },
        "abandoned": { "bg": "#fef2f2", "text": "#b91c1c", "border": "#fecaca" }
      },
      "risk": {
        "critical": "#ef4444",
        "high": "#f59e0b",
        "medium": "#3b82f6",
        "low": "#22c55e"
      },
      "accent": {
        "violet": "#7c3aed",
        "indigo": "#4f46e5",
        "teal": "#0d9488"
      }
    },

    "typography": {
      "fontFamily": {
        "sans": "'Inter', ui-sans-serif, system-ui, sans-serif",
        "mono": "'JetBrains Mono', ui-monospace, monospace"
      },
      "scale": {
        "pageTitle":     { "size": "1.5rem",   "weight": 700, "lineHeight": 1.25, "tracking": "-0.01em" },
        "sectionTitle":  { "size": "1rem",     "weight": 600, "lineHeight": 1.5 },
        "cardTitle":     { "size": "0.875rem", "weight": 600, "lineHeight": 1.5 },
        "body":          { "size": "0.875rem", "weight": 400, "lineHeight": 1.5 },
        "bodyMedium":    { "size": "0.875rem", "weight": 500, "lineHeight": 1.5 },
        "caption":       { "size": "0.75rem",  "weight": 400, "lineHeight": 1.5 },
        "label":         { "size": "0.75rem",  "weight": 500, "lineHeight": 1.5, "tracking": "0.025em", "transform": "uppercase" },
        "kpiValue":      { "size": "1.875rem", "weight": 700, "lineHeight": 1.25 },
        "kpiLabel":      { "size": "0.875rem", "weight": 400, "lineHeight": 1.5 },
        "badge":         { "size": "0.75rem",  "weight": 500, "lineHeight": 1 }
      }
    },

    "spacing": {
      "page":       { "maxWidth": "1400px", "paddingX": "1.5rem", "paddingY": "2rem" },
      "card":       { "padding": "1.5rem", "gap": "1rem" },
      "section":    { "gap": "1.5rem" },
      "grid":       { "gap": "1.5rem" },
      "inline":     { "gap": "0.5rem" },
      "chip":       { "paddingX": "0.75rem", "paddingY": "0.25rem" }
    },

    "borders": {
      "default":    { "width": "1px", "color": "var(--color-neutral-200)", "radius": "1rem" },
      "card":       { "width": "1px", "color": "var(--color-neutral-200)", "radius": "1rem" },
      "input":      { "width": "1px", "color": "var(--color-neutral-200)", "radius": "0.5rem" },
      "badge":      { "width": "0",   "radius": "9999px" },
      "chip":       { "width": "1px", "color": "var(--color-neutral-200)", "radius": "9999px" }
    },

    "shadows": {
      "sm":  "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      "md":  "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
      "lg":  "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
      "glow": "0 0 20px -5px rgb(59 130 246 / 0.15)"
    },

    "cards": {
      "default":  { "bg": "#ffffff", "border": "var(--border-color)", "radius": "1rem", "shadow": "sm", "padding": "1.5rem" },
      "kpi":      { "bg": "#ffffff", "border": "var(--border-color)", "radius": "0.75rem", "shadow": "sm", "padding": "1.25rem 1.5rem" },
      "alert":    { "bg": "#fffbeb", "border": "#fde68a", "radius": "0.75rem", "shadow": "none", "padding": "1rem 1.25rem" },
      "risk":     { "bg": "#fef2f2", "border": "#fecaca", "radius": "0.75rem", "shadow": "none", "padding": "1rem 1.25rem" },
      "dark":     { "bg": "#2d1b69", "border": "transparent", "radius": "1rem", "shadow": "lg", "padding": "1.5rem" }
    },

    "icons": {
      "assetTypes": {
        "patent":       "shield-check",
        "trademark":    "tag",
        "copyright":    "document-text",
        "design-right": "paint-brush"
      },
      "statuses": {
        "draft":     "pencil-square",
        "filed":     "paper-airplane",
        "published": "globe-alt",
        "granted":   "check-badge",
        "expired":   "clock",
        "abandoned": "x-circle"
      },
      "deadlineTypes": {
        "renewal":  "arrow-path",
        "response": "exclamation-triangle",
        "filing":   "document-plus",
        "review":   "clipboard-document-check",
        "custom":   "calendar"
      }
    }
  }
}
```

---

## Part 4: Animations Fonctionnelles

### 4.1 Page Transitions

| Animation | Element | Trigger | Duration | Easing | Purpose |
|-----------|---------|---------|----------|--------|---------|
| `page-fade-in` | Page content wrapper | Route navigation | 200ms | `ease-out` | Smooth context switch, reduces cognitive jarring |
| `page-slide-up` | Main content below nav | Initial page load | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Content feels like it "rises into place" |

```css
@keyframes page-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### 4.2 Dashboard KPI Cards — Staggered Entrance

| Animation | Element | Trigger | Duration | Easing | Purpose |
|-----------|---------|---------|----------|--------|---------|
| `kpi-enter` | Each KPI card | In viewport (IntersectionObserver) | 400ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Draw attention to key metrics, establish reading order |
| Stagger | Each card delayed by 80ms | Sequential | - | - | Left-to-right reading flow |

```css
@keyframes kpi-enter {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
```

**Functional value:** Users scan KPIs left-to-right. Stagger reinforces this reading pattern and draws focus to each metric sequentially.

### 4.3 Number Count-Up

| Animation | Element | Trigger | Duration | Easing | Purpose |
|-----------|---------|---------|----------|--------|---------|
| `count-up` | KPI values (totalAssets, granted, etc.) | Card enters viewport | 600ms | `ease-out` | Makes numbers feel "alive", draws attention to values |

```typescript
// Svelte action: use:countUp={targetValue}
function countUp(node: HTMLElement, target: number) {
  let start = 0;
  const duration = 600;
  const startTime = performance.now();
  function update(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    node.textContent = String(Math.round(start + (target - start) * eased));
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
```

**Functional value:** Static numbers are glanced over. Animated numbers demand attention and communicate "this data is fresh / just computed."

### 4.4 Health Score Gauge Animation

| Animation | Element | Trigger | Duration | Easing | Purpose |
|-----------|---------|---------|----------|--------|---------|
| `gauge-fill` | Health progress bar | Data loaded | 800ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Visualize portfolio health as a filling bar, instant understanding of "good" vs "bad" |

```css
@keyframes gauge-fill {
  from { width: 0%; }
  to { width: var(--health-score); }
}
```

### 4.5 Risk Banner Pulse

| Animation | Element | Trigger | Duration | Easing | Purpose |
|-----------|---------|---------|----------|--------|---------|
| `risk-pulse` | Risk banner left icon | Permanent (when visible) | 2s loop | `ease-in-out` | Subtle urgency signal without being annoying |

```css
@keyframes risk-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**Functional value:** The risk banner is conditional (only appears when urgent items exist). The pulse ensures it's noticed even if the user scrolls past quickly.

### 4.6 Flashlight Hover (Cards)

| Animation | Element | Trigger | Duration | Easing | Purpose |
|-----------|---------|---------|----------|--------|---------|
| `flashlight` | Asset cards, portfolio cards | Mouse move (hover) | Real-time (pointer tracking) | - | Highlight interactive areas, encourage exploration |

```typescript
// Svelte action: use:flashlight
function flashlight(node: HTMLElement) {
  function handleMove(e: MouseEvent) {
    const rect = node.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    node.style.setProperty('--flash-x', `${x}px`);
    node.style.setProperty('--flash-y', `${y}px`);
  }
  node.addEventListener('mousemove', handleMove);
  return { destroy() { node.removeEventListener('mousemove', handleMove); } };
}
```

```css
.flashlight-card {
  position: relative;
  overflow: hidden;
}
.flashlight-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    300px circle at var(--flash-x, 50%) var(--flash-y, 50%),
    rgb(59 130 246 / 0.04),
    transparent 70%
  );
  pointer-events: none;
  opacity: 0;
  transition: opacity 300ms;
}
.flashlight-card:hover::after {
  opacity: 1;
}
```

**Functional value:** Ultra-subtle (0.04 opacity). Only visible on hover. Guides the eye to the cursor position within a card, making large cards feel more responsive. Used on: Recent Assets rows, Portfolio cards, Deadline items.

### 4.7 Status Change Celebration

| Animation | Element | Trigger | Duration | Easing | Purpose |
|-----------|---------|---------|----------|--------|---------|
| `status-flash` | Status badge | Status transition completes | 400ms | `ease-out` | Confirms the action was successful, provides closure |

```css
@keyframes status-flash {
  0% { box-shadow: 0 0 0 0 rgb(34 197 94 / 0.4); }
  70% { box-shadow: 0 0 0 8px rgb(34 197 94 / 0); }
  100% { box-shadow: 0 0 0 8px rgb(34 197 94 / 0); }
}
```

### 4.8 Skeleton Loading

| Animation | Element | Trigger | Duration | Easing | Purpose |
|-----------|---------|---------|----------|--------|---------|
| `skeleton-shimmer` | Placeholder blocks | Data loading | 1.5s loop | `linear` | Communicates "content is loading" without layout shift |

```css
@keyframes skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite linear;
  border-radius: 0.5rem;
}
```

**Functional value:** Replaces the current "---" placeholder with a proper skeleton that preserves layout and communicates loading state.

### 4.9 Deadline Complete Checkmark

| Animation | Element | Trigger | Duration | Easing | Purpose |
|-----------|---------|---------|----------|--------|---------|
| `check-draw` | SVG checkmark path | Deadline toggled complete | 300ms | `ease-out` | Satisfying micro-interaction, confirms action |
| `row-fade` | Deadline row | After check animation | 200ms | `ease-in` | Row fades to 50% opacity, moves to "completed" |

```css
@keyframes check-draw {
  from { stroke-dashoffset: 16; }
  to { stroke-dashoffset: 0; }
}
```

### 4.10 Border Beam (Critical Actions)

| Animation | Element | Trigger | Duration | Easing | Purpose |
|-----------|---------|---------|----------|--------|---------|
| `border-beam` | "Renew", "Escalate", "Generate Report" buttons | Always visible (on critical buttons only) | 3s loop | `linear` | Draw attention to time-sensitive actions without being aggressive |

```css
@keyframes border-beam {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
.border-beam {
  position: relative;
  overflow: hidden;
}
.border-beam::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(90deg, transparent, var(--color-primary-400), transparent);
  background-size: 200% 100%;
  animation: border-beam 3s linear infinite;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
}
```

**Functional value:** Only used on 2-3 buttons in the entire app — those tied to legal deadlines or compliance actions. The subtle traveling gradient says "this needs your attention" without flashing or pulsing.

---

## Part 5: Slides Pedagogiques (Onboarding / Marketing)

### Slide 1 — Cover
**Layout:** Full-screen, centered text, dark gradient background (#2d1b69 to #1e1245).
**Title:** "Pilotez votre patrimoine IP comme un portefeuille d'actifs strategiques."
**Subtitle:** "IPMS — Intellectual Property Management System"
**Animation:** Title fades in (400ms), then subtitle slides up (300ms, 100ms delay).
**Visual:** Subtle grid pattern overlay at 3% opacity.

### Slide 2 — Inventaire
**Layout:** Left text (60%), right visual (40% — screenshot of asset list).
**Title:** "Centralisez tous vos actifs"
**Points:** Brevets, marques, copyrights et design rights dans une vue unifiee. Import Excel en un clic. Recherche et filtres instantanes.
**Animation:** Text slides in from left (300ms), screenshot fades in from right (400ms, 150ms delay).
**Business value:** "Eliminez les tableurs isoles. Une source de verite pour toute l'equipe."

### Slide 3 — Classification
**Layout:** Center text, below: 4 icon cards in a row (patent, trademark, copyright, design-right).
**Title:** "Classez et structurez automatiquement"
**Points:** Types d'actifs, juridictions, classifications IPC/CPC. Metadata enrichie. Tags et portfolios personnalises.
**Animation:** Cards stagger in from bottom (80ms delay each), icons scale from 0.8 to 1.
**Business value:** "Retrouvez n'importe quel actif en 3 secondes."

### Slide 4 — Echeances
**Layout:** Right text (50%), left visual (50% — kanban deadline view).
**Title:** "Ne manquez plus aucune echeance"
**Points:** Renouvellements, reponses aux offices, depots. Alertes automatiques. Vue kanban par urgence.
**Animation:** Kanban columns slide in one by one from left (100ms stagger).
**Business value:** "Chaque jour en retard coute des milliers d'euros. IPMS vous alerte avant."

### Slide 5 — Risque
**Layout:** Full-width, KPI cards row on top, risk heatmap below.
**Title:** "Evaluez le risque en temps reel"
**Points:** Health score du portefeuille. Assets a risque identifies. Expirations dans les 90 jours.
**Animation:** KPI count-up animation (600ms), health bar fills (800ms).
**Business value:** "Presentez un rapport de risque clair a votre direction en 30 secondes."

### Slide 6 — Collaboration
**Layout:** Center text, below: activity feed mockup.
**Title:** "Collaborez sans friction"
**Points:** Historique des changements de statut. Notifications en temps reel. Roles et permissions par equipe.
**Animation:** Activity feed items cascade in from top (60ms stagger), fade + slide.
**Business value:** "Juristes, ingenieurs et management sur la meme page."

### Slide 7 — Reporting
**Layout:** Left text (40%), right visual (60% — charts grid).
**Title:** "Des insights actionnables"
**Points:** Distribution par type et juridiction. Timeline des expirations. Export PDF pour le board.
**Animation:** Charts animate in (donut draws clockwise 800ms, bars grow up 500ms stagger).
**Business value:** "Transformez des donnees brutes en decisions strategiques."

### Slide 8 — CTA
**Layout:** Full-screen, centered, gradient background.
**Title:** "Centralisez vos brevets, contrats et marques dans un seul cockpit."
**CTA Button:** "Commencer maintenant" with border-beam animation.
**Sub-text:** "Gratuit pour les equipes de moins de 10 actifs."
**Animation:** Title clip-reveals from left (400ms), CTA button fades in (300ms, 200ms delay) with border-beam starting.

---

## Part 6: Phase 1 — Implementation Priority

### Scope Phase 1 (implementer immediatement)

| Priority | Item | Page | Impact |
|----------|------|------|--------|
| P0 | Skeleton loading states | All pages | Eliminate content jumps |
| P0 | KPI staggered entrance + count-up | Dashboard | Hero experience |
| P0 | Health gauge animation | Dashboard | Visual impact |
| P1 | Flashlight hover on cards | Dashboard, Assets, Portfolios | Polish |
| P1 | Risk banner (conditional) | Dashboard | Urgency communication |
| P1 | Status change flash confirmation | Asset detail | Action feedback |
| P1 | Border beam on critical buttons | Asset detail, Deadlines | Attention guidance |
| P2 | Page fade-in transitions | All pages | Navigation smoothness |
| P2 | Deadline check animation | Deadlines | Micro-interaction |
| P2 | Skeleton shimmer | All pages | Loading polish |

### Out of Scope Phase 1
- Reports/Insights page (new page)
- Kanban deadline view (redesign)
- Asset detail tabs (redesign)
- Slides/onboarding system
- Marquee/loop animations
- Activity feed component

### Phase 1 Files to Create/Modify

**New files:**
- `apps/web/src/lib/animations/count-up.ts` — countUp Svelte action
- `apps/web/src/lib/animations/flashlight.ts` — flashlight Svelte action
- `apps/web/src/lib/animations/in-view.ts` — IntersectionObserver Svelte action
- `packages/design-system/src/animations.css` — all @keyframes

**Modified files:**
- `packages/design-system/src/tokens.css` — new animation tokens
- `apps/web/src/routes/(app)/dashboard/+page.svelte` — KPI animations, risk banner, skeleton, health gauge
- `apps/web/src/routes/(app)/assets/[id]/+page.svelte` — status flash, border beam
- `apps/web/src/routes/(app)/deadlines/+page.svelte` — check animation
- `apps/web/src/routes/(app)/+layout.svelte` — page transition wrapper
- `apps/web/src/app.css` — import animations.css
