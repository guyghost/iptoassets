# Legal Actions Display Design

**Goal:** Parse raw Questel legal actions text into structured data and display it as an interactive, digestible UI on the asset detail page.

**Architecture:** Client-side parser (shared between import and display), Svelte accordion component, lazy migration for existing imports.

---

## Data Structure

```ts
interface ParsedLegalActions {
  members: LegalMember[];
}

interface LegalMember {
  id: string;              // "EP4537086"
  country: string;         // "EP"
  legalState: string;      // "ALIVE" | "DEAD"
  status: string;          // "PENDING" | "GRANTED" | "LAPSED"
  expiryDate: string | null;
  events: LegalEvent[];
  memberStates: LegalMemberState[];
}

interface LegalMemberState {
  id: string;
  country: string;
  legalState: string;
  status: string;
  expiryDate: string | null;
  events: LegalEvent[];
}

interface LegalEvent {
  date: string;
  code: string;
  group: string;
  indicator: "Pos" | "Neg" | null;
  description: string;
}
```

## UI Layout

1. **Jurisdiction summary bar** — horizontal badges per member: `[EP] ALIVE PENDING`, `[FR] ALIVE GRANTED`, color-coded
2. **Accordion per member** — collapsible, all collapsed by default
   - Header: country code + patent number + status badge + expiry date
   - Body: status details, member states (nested mini-accordion), events timeline
3. **Events timeline** — vertical timeline, most recent first, color dots per event group
   - Noise events (admin notifications, classification changes) collapsed by default with "Show N more" toggle

## Implementation

- **Parser:** `src/features/assets/parse-legal-actions.ts` — pure function
- **Component:** `src/features/assets/LegalStatus.svelte` — accordion UI
- **Import:** Store `parsedLegalActions` in metadata during import
- **Fallback:** Parse on-the-fly from raw text if structured data missing

## Event Group Colors

- Examination events: blue
- Entry into national phase: indigo
- Designated states: purple
- Payment notifications: emerald
- Event indicating In Force: green
- Event indicating Not In Force: red
- Administrative notifications: neutral (collapsed by default)
- Classification modifications: amber (collapsed by default)
