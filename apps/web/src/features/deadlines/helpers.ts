export const filters = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "completed", label: "Completed" },
];

export const typeColors: Record<string, { bg: string; text: string; label: string }> = {
  renewal: { bg: "bg-amber-100", text: "text-amber-700", label: "Renewal" },
  response: { bg: "bg-red-100", text: "text-red-700", label: "Response" },
  filing: { bg: "bg-blue-100", text: "text-blue-700", label: "Filing" },
  review: { bg: "bg-purple-100", text: "text-purple-700", label: "Review" },
  custom: { bg: "bg-teal-100", text: "text-teal-700", label: "Custom" },
};

export interface DeadlineItem {
  id: string;
  assetId: string;
  type: string;
  title: string;
  dueDate: string;
  completed: boolean;
  organizationId: string;
  assetName: string;
}

function now(): Date {
  return new Date();
}

export function getDaysUntil(dateStr: string): number {
  const due = new Date(dateStr);
  const today = now();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getRelativeDate(dateStr: string): string {
  const days = getDaysUntil(dateStr);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days < 0) return `${Math.abs(days)} days ago`;
  return `in ${days} days`;
}

export function isOverdue(d: DeadlineItem): boolean {
  return !d.completed && getDaysUntil(d.dueDate) < 0;
}

export function isDueThisWeek(d: DeadlineItem): boolean {
  const days = getDaysUntil(d.dueDate);
  return !d.completed && days >= 0 && days <= 6;
}

export function isDueThisMonth(d: DeadlineItem): boolean {
  const due = new Date(d.dueDate);
  const today = now();
  return !d.completed && due.getMonth() === today.getMonth() && due.getFullYear() === today.getFullYear();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
