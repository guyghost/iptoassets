export interface LegalEvent {
  readonly date: string;
  readonly code: string;
  readonly group: string;
  readonly indicator: "Pos" | "Neg" | null;
  readonly description: string;
}

export interface LegalMemberState {
  readonly id: string;
  readonly country: string;
  readonly legalState: string;
  readonly status: string;
  readonly expiryDate: string | null;
  readonly events: LegalEvent[];
}

export interface LegalMember {
  readonly id: string;
  readonly country: string;
  readonly legalState: string;
  readonly status: string;
  readonly expiryDate: string | null;
  readonly events: LegalEvent[];
  readonly memberStates: LegalMemberState[];
}

export interface ParsedLegalActions {
  readonly members: LegalMember[];
}

function extractCountry(id: string): string {
  const m = id.match(/^([A-Z]{2})/);
  if (m) return m[1];
  // Handle WO format like "WO2023/237980"
  if (id.startsWith("WO")) return "WO";
  return id.slice(0, 2);
}

function parseHeader(lines: string[]): { legalState: string; status: string; expiryDate: string | null } {
  let legalState = "";
  let status = "";
  let expiryDate: string | null = null;

  for (const line of lines) {
    const kvMatch = line.match(/^(.+?)=(.+)$/);
    if (!kvMatch) continue;
    const [, key, value] = kvMatch;
    if (key === "Legal state") legalState = value.trim();
    else if (key === "Status") status = value.trim();
    else if (key === "Actual or expected expiration date") expiryDate = value.trim();
  }

  return { legalState, status, expiryDate };
}

function parseEvents(lines: string[]): LegalEvent[] {
  const events: LegalEvent[] = [];
  let i = 0;

  while (i < lines.length) {
    const dateMatch = lines[i].match(/^Event publication date=(\d{4}-\d{2}-\d{2})$/);
    if (!dateMatch) { i++; continue; }

    const date = dateMatch[1];
    let code = "";
    let group = "";
    let indicator: "Pos" | "Neg" | null = null;
    const descParts: string[] = [];
    i++;

    // Collect all key=value pairs and description lines for this event
    while (i < lines.length && !lines[i].match(/^Event publication date=/)) {
      const kv = lines[i].match(/^(.+?)=(.+)$/);
      if (kv) {
        const [, key, value] = kv;
        if (key === "Event code" && !code) code = value.trim();
        else if (key === "Event group") group = value.trim();
        else if (key === "Event indicator") {
          indicator = value.trim() === "Pos" ? "Pos" : value.trim() === "Neg" ? "Neg" : null;
        }
        // Skip other key=value pairs from description
      } else if (lines[i].trim() && !lines[i].startsWith("Corresponding cc:") && !lines[i].startsWith("Designated or member state=")) {
        descParts.push(lines[i].trim());
      }
      i++;
    }

    // Build a concise description from the non-kv lines
    const description = descParts
      .filter(d => d !== "Original code: STAA" && !d.startsWith("Original code:"))
      .join(" — ")
      .slice(0, 200);

    if (date && (code || description)) {
      events.push({ date, code, group, indicator, description });
    }
  }

  // Sort most recent first
  events.sort((a, b) => b.date.localeCompare(a.date));
  return events;
}

function parseMemberBlock(blockLines: string[]): { header: ReturnType<typeof parseHeader>; events: LegalEvent[] } {
  // Find where events start (first "Event publication date=")
  const eventStart = blockLines.findIndex(l => l.startsWith("Event publication date="));
  const headerLines = eventStart >= 0 ? blockLines.slice(0, eventStart) : blockLines;
  const eventLines = eventStart >= 0 ? blockLines.slice(eventStart) : [];

  return {
    header: parseHeader(headerLines),
    events: parseEvents(eventLines),
  };
}

export function parseLegalActions(raw: string): ParsedLegalActions {
  if (!raw || !raw.trim()) return { members: [] };

  const lines = raw.split(/\r?\n/).map(l => l.trim());
  const members: LegalMember[] = [];

  // Split into top-level member sections by "(PATENT_ID)\n...\nLEGAL DETAILS FOR PATENT_ID"
  // Pattern: line starting with "(" containing a patent ID
  const topLevelIndices: { index: number; id: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const idMatch = lines[i].match(/^\(([^)]+)\)$/);
    if (idMatch) {
      // Next non-empty line should be "LEGAL DETAILS FOR ..."
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j < lines.length && lines[j].startsWith("LEGAL DETAILS FOR ")) {
        topLevelIndices.push({ index: i, id: idMatch[1] });
      }
    }
  }

  // If no top-level sections found, try to parse as a single block
  if (topLevelIndices.length === 0) {
    // Check if it starts directly with "LEGAL DETAILS FOR"
    const firstNonEmpty = lines.findIndex(l => l.trim());
    if (firstNonEmpty >= 0 && lines[firstNonEmpty].startsWith("LEGAL DETAILS FOR ")) {
      const id = lines[firstNonEmpty].replace("LEGAL DETAILS FOR ", "").trim();
      const { header, events } = parseMemberBlock(lines.slice(firstNonEmpty + 1));
      members.push({
        id,
        country: extractCountry(id),
        ...header,
        events,
        memberStates: [],
      });
    }
    return { members };
  }

  for (let idx = 0; idx < topLevelIndices.length; idx++) {
    const { index: startIdx, id } = topLevelIndices[idx];
    const endIdx = idx + 1 < topLevelIndices.length ? topLevelIndices[idx + 1].index : lines.length;
    const sectionLines = lines.slice(startIdx, endIdx);

    // Find "LEGAL DETAILS FOR <id>" line
    const headerLineIdx = sectionLines.findIndex(l => l === `LEGAL DETAILS FOR ${id}`);
    if (headerLineIdx < 0) continue;

    // Find MEMBER STATE sections within this block
    const memberStateIndices: { index: number; id: string }[] = [];
    for (let i = headerLineIdx + 1; i < sectionLines.length; i++) {
      const msMatch = sectionLines[i].match(/^MEMBER STATE LEGAL DETAILS FOR (.+)$/);
      if (msMatch) {
        memberStateIndices.push({ index: i, id: msMatch[1] });
      }
    }

    // Parse main member block (before first member state)
    const mainEnd = memberStateIndices.length > 0 ? memberStateIndices[0].index : sectionLines.length;
    const mainBlock = sectionLines.slice(headerLineIdx + 1, mainEnd);
    const { header: mainHeader, events: mainEvents } = parseMemberBlock(mainBlock);

    // Parse member states
    const memberStates: LegalMemberState[] = [];
    for (let msIdx = 0; msIdx < memberStateIndices.length; msIdx++) {
      const msStart = memberStateIndices[msIdx].index + 1;
      const msEnd = msIdx + 1 < memberStateIndices.length ? memberStateIndices[msIdx + 1].index : sectionLines.length;
      const msBlock = sectionLines.slice(msStart, msEnd);
      const { header: msHeader, events: msEvents } = parseMemberBlock(msBlock);

      const msId = memberStateIndices[msIdx].id;
      memberStates.push({
        id: msId,
        country: extractCountry(msId),
        ...msHeader,
        events: msEvents,
      });
    }

    members.push({
      id,
      country: extractCountry(id),
      ...mainHeader,
      events: mainEvents,
      memberStates,
    });
  }

  return { members };
}
