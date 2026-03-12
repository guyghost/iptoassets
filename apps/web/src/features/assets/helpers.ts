export const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-[var(--color-neutral-100)]", text: "text-[var(--color-neutral-600)]", label: "Draft" },
  filed: { bg: "bg-blue-50", text: "text-blue-700", label: "Filed" },
  published: { bg: "bg-indigo-50", text: "text-indigo-700", label: "Published" },
  granted: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Granted" },
  expired: { bg: "bg-amber-50", text: "text-amber-700", label: "Expired" },
  abandoned: { bg: "bg-red-50", text: "text-red-700", label: "Abandoned" },
};

export const typeLabels: Record<string, string> = {
  patent: "Patent",
  trademark: "Trademark",
  copyright: "Copyright",
  "design-right": "Design Right",
};

export const filters = [
  { id: "all", label: "All" },
  { id: "patent", label: "Patents" },
  { id: "trademark", label: "Trademarks" },
  { id: "copyright", label: "Copyrights" },
  { id: "design-right", label: "Design Rights" },
];

// Status transitions: from -> possible next statuses
export const statusTransitions: Record<string, string[]> = {
  draft: ["filed"],
  filed: ["published", "abandoned"],
  published: ["granted", "abandoned"],
  granted: ["expired"],
  expired: [],
  abandoned: [],
};

export const transitionButtonColors: Record<string, string> = {
  filed: "bg-blue-600 hover:bg-blue-700 text-white",
  published: "bg-indigo-600 hover:bg-indigo-700 text-white",
  granted: "bg-emerald-600 hover:bg-emerald-700 text-white",
  expired: "bg-amber-600 hover:bg-amber-700 text-white",
  abandoned: "bg-red-100 hover:bg-red-200 text-red-700",
};

export function cleanTitle(raw: string): string {
  const idx = raw.search(/\([A-Z]{2}[\w\/-]+\)/);
  if (idx > 0) return raw.slice(0, idx).trim();
  return raw;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
