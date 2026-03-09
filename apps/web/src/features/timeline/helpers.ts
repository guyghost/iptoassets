import { statusConfig } from "../assets/helpers";

export function formatTimelineEntry(fromStatus: string | null, toStatus: string): string {
  if (!fromStatus) {
    return `Created as ${statusConfig[toStatus]?.label ?? toStatus}`;
  }
  return `${statusConfig[fromStatus]?.label ?? fromStatus} → ${statusConfig[toStatus]?.label ?? toStatus}`;
}

export function formatTimelineDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
