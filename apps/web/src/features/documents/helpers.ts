import type { DocumentType, DocumentStatus } from "./data";

export const statusFilters = [
  { id: "all", label: "All" },
  { id: "uploaded", label: "Uploaded" },
  { id: "under-review", label: "Under Review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

export const typeConfig: Record<DocumentType, { bg: string; text: string; label: string }> = {
  filing: { bg: "bg-blue-50", text: "text-blue-700", label: "Filing" },
  correspondence: { bg: "bg-purple-50", text: "text-purple-700", label: "Correspondence" },
  certificate: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Certificate" },
  evidence: { bg: "bg-amber-50", text: "text-amber-700", label: "Evidence" },
  other: { bg: "bg-[var(--color-neutral-100)]", text: "text-[var(--color-neutral-600)]", label: "Other" },
};

export const statusConfig: Record<DocumentStatus, { bg: string; text: string; label: string }> = {
  uploaded: { bg: "bg-[var(--color-neutral-100)]", text: "text-[var(--color-neutral-600)]", label: "Uploaded" },
  "under-review": { bg: "bg-amber-50", text: "text-amber-700", label: "Under Review" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Approved" },
  rejected: { bg: "bg-red-50", text: "text-red-700", label: "Rejected" },
};
