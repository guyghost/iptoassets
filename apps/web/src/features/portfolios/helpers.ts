export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export const statusConfig: Record<string, { bg: string; text: string }> = {
  Draft: { bg: "bg-[var(--color-neutral-100)]", text: "text-[var(--color-neutral-600)]" },
  Filed: { bg: "bg-blue-50", text: "text-blue-700" },
  Published: { bg: "bg-indigo-50", text: "text-indigo-700" },
  Granted: { bg: "bg-emerald-50", text: "text-emerald-700" },
};

export const typeColorConfig: Record<string, { bg: string; text: string }> = {
  Patent: { bg: "bg-blue-50", text: "text-blue-700" },
  Trademark: { bg: "bg-purple-50", text: "text-purple-700" },
  Copyright: { bg: "bg-amber-50", text: "text-amber-700" },
};
