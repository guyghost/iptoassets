export const IP_TYPES = [
  "patent",
  "trademark",
  "copyright",
  "design-right",
] as const;
export type IPType = (typeof IP_TYPES)[number];

export const ASSET_STATUSES = [
  "draft",
  "filed",
  "published",
  "granted",
  "expired",
  "abandoned",
] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const DEADLINE_TYPES = [
  "renewal",
  "response",
  "filing",
  "review",
  "custom",
] as const;
export type DeadlineType = (typeof DEADLINE_TYPES)[number];

export const DOCUMENT_TYPES = [
  "filing",
  "correspondence",
  "certificate",
  "evidence",
  "other",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_STATUSES = [
  "uploaded",
  "under-review",
  "approved",
  "rejected",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export interface Jurisdiction {
  readonly code: string;
  readonly name: string;
}
