# Landing Page Design — iptoassets

## Overview

Premium landing page for iptoassets, an IP management SaaS. Replaces the current root route (`/`) which currently redirects to `/dashboard` or `/login`. Unauthenticated users will see the landing page; authenticated users redirect to `/dashboard`.

## Tech Stack

- SvelteKit (existing app)
- Tailwind CSS v4 (existing)
- Svelte 5 transitions for scroll animations
- No external image dependencies (CSS-only product mockups)

## Design System (Landing Page)

### Typography

- **Font family:** Geist Sans (headings + body), Geist Mono (accents, pricing numbers, labels)
- **Hero headline:** 56px / semibold / -0.02em letter-spacing
- **Section titles:** 40px / semibold / -0.015em
- **Body:** 18px / regular / 1.6 line-height
- **Small text:** 14px / regular or medium

### Color Palette

| Token | Value | Usage |
|---|---|---|
| Background | `#f8fafc` | Page background |
| Surface | `#ffffff` | Cards, navbar |
| Primary | `#2563eb` | Buttons, links, accents |
| Primary hover | `#1d4ed8` | Button hover states |
| Primary tint | `#eff6ff` | Light feature card backgrounds |
| Headings | `#0f172a` | All headings |
| Body text | `#475569` | Paragraphs, descriptions |
| Muted | `#94a3b8` | Captions, secondary text |
| Border | `#e2e8f0` | Card borders, dividers |
| Footer bg | `#0f172a` | Footer background |
| Footer text | `#94a3b8` | Footer body text |

### Layout

- Max content width: 1200px, centered
- Section vertical padding: 96px
- Horizontal padding: 24px
- Button border-radius: 6px
- Card border-radius: 8px (small), 12px (pricing)

### Animations

- Scroll-triggered fade-in + translateY(20px -> 0)
- Duration: 500ms, ease-out
- Stagger: 100ms between sibling elements
- Hero section: visible immediately (no animation delay)

## Sections

### 1. Navbar (Sticky)

- **Left:** Logo "iptoassets" in Geist Mono, semibold
- **Right:** "Features" | "Pricing" (anchor links) + "Sign in" (text link) + "Get Started" (primary button, small)
- White background with subtle `border-bottom` on scroll
- Backdrop blur for slight glass effect

### 2. Hero

**Layout:** Two columns — text left (55%), CSS dashboard mockup right (45%). Full viewport height. Vertically centered.

**Left column:**
- Label: `font-mono`, "IP PORTFOLIO MANAGEMENT", primary blue, uppercase, 12px, letter-spacing 0.1em
- Headline: "Track, protect, and grow your intellectual property"
- Sub-headline: "The modern platform for patent and trademark management. Monitor deadlines, analyze portfolios, and make smarter renewal decisions -- all in one place."
- CTA: "Start for free" (primary filled, large) + "See how it works" (outline, large)
- Reassurance: "No credit card required . Free for up to 50 assets" (14px, muted)

**Right column:**
- CSS-rendered mini dashboard in a white card with shadow-elevated
- 3 stat cards row: 127 Assets, 12 Upcoming Deadlines, 94% Renewal Rate
- Mini data table: 3 rows with asset names and status badges (Active, Pending, Filed)
- Subtle 3D tilt: `transform: perspective(1200px) rotateY(-4deg)`
- Faint dot-grid pattern behind the mockup

### 3. Benefits

**Title:** "Why teams choose iptoassets"
**Subtitle:** "Built for IP professionals who need clarity, not complexity."

**Layout:** 4 cards in a row (2x2 tablet, stacked mobile).

Card style: `#f8fafc` background, 1px border, 8px radius, icon in 48x48 circle with `#eff6ff` bg.

| Card | Title | Description |
|---|---|---|
| 1 | Centralized portfolio | All your patents, trademarks, and designs in one structured view. Filter, search, and export in seconds. |
| 2 | Deadline intelligence | Never miss a renewal or filing deadline. Smart alerts surface what needs attention before it's too late. |
| 3 | Actionable analytics | Understand portfolio composition, cost trends, and renewal patterns at a glance with built-in dashboards. |
| 4 | Team collaboration | Invite colleagues, assign roles, and share portfolio views. Everyone stays aligned without email chains. |

### 4. Features (Bento Grid)

**Title:** "Everything you need to manage IP, nothing you don't"

Alternating rows: text + CSS mockup visual, flipping sides each row. 64px vertical spacing between blocks.

**Feature 1 — Portfolio Overview** (text left, visual right)
- Title: "Your entire portfolio at a glance"
- Body: "See every asset across jurisdictions, types, and statuses. Advanced filters and bulk actions make managing hundreds of assets feel effortless."
- Visual: Mini asset list with filter chips and status badges

**Feature 2 — Deadline Tracking** (visual left, text right)
- Title: "Deadlines that don't slip through"
- Body: "Automatic deadline detection from legal status data. Calendar view, risk scoring, and configurable alerts keep your team ahead of every deadline."
- Visual: Mini calendar/timeline with colored deadline indicators

**Feature 3 — Document Management** (text left, visual right)
- Title: "Every document, instantly findable"
- Body: "Upload, classify, and link documents to assets automatically. AI-powered classification saves hours of manual sorting."
- Visual: Document cards with file type icons and classification tags

**Feature 4 — Analytics & Reporting** (visual left, text right)
- Title: "Insights that drive decisions"
- Body: "Track portfolio costs, renewal rates, and asset distribution across jurisdictions. Export reports for board presentations or budget reviews."
- Visual: Mini bar chart or donut with stat highlights

### 5. Social Proof / Testimonials

**Title:** "Trusted by IP professionals"

**Layout:** 3 cards in a row (stacked mobile).

Card style: white bg, 1px border, 8px radius, subtle shadow. Large decorative quotation mark in primary blue (opacity 0.2).

| Quote | Author | Role |
|---|---|---|
| "We went from spreadsheet chaos to complete visibility in a week." | S.M. | Head of IP, Biotech Company |
| "The deadline alerts alone saved us from a costly lapse. This tool pays for itself." | A.R. | Patent Attorney, Law Firm |
| "Finally, an IP tool that doesn't feel like it was designed in 2005." | L.K. | Innovation Director, Electronics Group |

Avatar: 40x40 circle with colored initials (no photos).

Below cards: "Trusted by teams at" + 4-5 placeholder gray logo rectangles (low opacity).

### 6. Pricing

**Title:** "Simple, transparent pricing"
**Subtitle:** "Start free. Upgrade when you need more."

**Layout:** 3 cards. Pro (middle) highlighted with 2px primary border and "Most popular" badge.

Plan name in Geist Mono, uppercase, 14px, letter-spacing 0.05em. Price in 48px semibold.

| | Free | Pro (highlighted) | Enterprise |
|---|---|---|---|
| Price | 0 EUR | 49 EUR/mo | Custom |
| Assets | Up to 50 | Unlimited | Unlimited |
| Users | 1 | Up to 10 | Unlimited |
| Deadline alerts | Basic | Smart + Risk scoring | Custom SLA |
| Document storage | 1 GB | 25 GB | Unlimited |
| Analytics | Basic | Advanced | Custom reports |
| Support | Community | Priority email | Dedicated CSM |
| CTA | "Get started" (outline) | "Start free trial" (primary filled) | "Contact sales" (outline) |

### 7. Footer

**Background:** `#0f172a` (neutral-900). Text in `#94a3b8`.

**Layout:** 4 columns + bottom bar.

- Column 1: Logo "iptoassets" (Geist Mono, white) + one-liner tagline
- Column 2: Product — Features, Pricing, Changelog, Roadmap
- Column 3: Company — About, Blog, Careers, Contact
- Column 4: Legal — Privacy Policy, Terms of Service, GDPR

**Bottom bar:** "(c) 2026 iptoassets. All rights reserved." (left) + social icons LinkedIn, X (right).

## Routing Changes

- `+page.server.ts` (root): authenticated users redirect to `/dashboard`, unauthenticated users render the landing page (remove redirect to `/login`)
- `+page.svelte` (root): becomes the landing page component
- Landing page does NOT use the app's `(app)` layout — it has its own standalone layout (navbar + footer)

## File Structure

```
apps/web/src/routes/
  +page.svelte          -- Landing page (replaces redirect comment)
  +page.server.ts       -- Modified: only redirect authenticated users
  (app)/                -- Existing app routes (unchanged)
  (public)/             -- Existing public routes (unchanged)
```

Landing page components (if needed for organization):
```
apps/web/src/routes/
  _components/
    Navbar.svelte
    Hero.svelte
    Benefits.svelte
    Features.svelte
    Testimonials.svelte
    Pricing.svelte
    Footer.svelte
    DashboardMockup.svelte
    FadeIn.svelte         -- Scroll-triggered fade-in wrapper
```

## Fonts

Geist Sans and Geist Mono loaded via `@fontsource/geist-sans` and `@fontsource/geist-mono` npm packages, imported only on the landing page to avoid affecting the app's existing Inter-based typography.
