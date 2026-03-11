import type {
  AssetId,
  AuditEventId,
  DeadlineId,
  DocumentId,
  InvitationId,
  MembershipId,
  NotificationId,
  PortfolioId,
  StatusChangeEventId,
  OrganizationId,
  UserId,
  IPType,
  AssetStatus,
  DeadlineType,
  DocumentType,
  DocumentStatus,
  Jurisdiction,
  PriorArtResultId,
} from "@ipms/shared";

export interface IPAsset {
  readonly id: AssetId;
  readonly title: string;
  readonly type: IPType;
  readonly jurisdiction: Jurisdiction;
  readonly status: AssetStatus;
  readonly filingDate: Date | null;
  readonly expirationDate: Date | null;
  readonly owner: string;
  readonly organizationId: OrganizationId;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Deadline {
  readonly id: DeadlineId;
  readonly assetId: AssetId;
  readonly type: DeadlineType;
  readonly title: string;
  readonly dueDate: Date;
  readonly completed: boolean;
  readonly organizationId: OrganizationId;
}

export interface Document {
  readonly id: DocumentId;
  readonly assetId: AssetId;
  readonly name: string;
  readonly type: DocumentType;
  readonly url: string;
  readonly uploadedAt: Date;
  readonly status: DocumentStatus;
  readonly organizationId: OrganizationId;
  readonly tags: readonly string[];
}

export interface Portfolio {
  readonly id: PortfolioId;
  readonly name: string;
  readonly description: string;
  readonly assetIds: readonly AssetId[];
  readonly owner: string;
  readonly organizationId: OrganizationId;
}

export interface StatusChangeEvent {
  readonly id: StatusChangeEventId;
  readonly assetId: AssetId;
  readonly fromStatus: AssetStatus | null;
  readonly toStatus: AssetStatus;
  readonly changedAt: Date;
  readonly changedBy: string;
  readonly organizationId: OrganizationId;
}

export interface BulkOperationResult {
  readonly succeeded: number;
  readonly failed: number;
  readonly errors: readonly { readonly id: string; readonly reason: string }[];
}

export const MEMBER_ROLES = ["viewer", "attorney", "manager", "admin"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export interface User {
  readonly id: UserId;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly authProviderId: string;
  readonly createdAt: Date;
}

export interface Organization {
  readonly id: OrganizationId;
  readonly name: string;
  readonly ownerId: UserId;
  readonly createdAt: Date;
}

export interface Membership {
  readonly id: MembershipId;
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
  readonly role: MemberRole;
  readonly joinedAt: Date;
}

export const AUDIT_ACTIONS = [
  "asset:create", "asset:update-status", "asset:delete",
  "deadline:create", "deadline:complete",
  "document:create", "document:update-status", "document:delete",
  "portfolio:create", "portfolio:add-asset", "portfolio:remove-asset", "portfolio:delete",
  "membership:invite", "membership:change-role", "membership:remove",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const ENTITY_TYPES = ["asset", "deadline", "document", "portfolio", "membership"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export interface AuditEvent {
  readonly id: AuditEventId;
  readonly organizationId: OrganizationId;
  readonly actorId: UserId;
  readonly action: AuditAction;
  readonly entityType: EntityType;
  readonly entityId: string;
  readonly metadata: Record<string, string> | null;
  readonly timestamp: Date;
}

export const NOTIFICATION_TYPES = [
  "deadline:upcoming", "deadline:overdue",
  "document:review", "document:approved", "document:rejected",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface Notification {
  readonly id: NotificationId;
  readonly organizationId: OrganizationId;
  readonly recipientId: UserId;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly entityType: EntityType;
  readonly entityId: string;
  readonly read: boolean;
  readonly createdAt: Date;
}

export const INVITATION_STATUSES = ["pending", "accepted", "expired"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export interface Invitation {
  readonly id: InvitationId;
  readonly organizationId: OrganizationId;
  readonly invitedByUserId: UserId;
  readonly email: string;
  readonly role: MemberRole;
  readonly status: InvitationStatus;
  readonly createdAt: Date;
  readonly expiresAt: Date;
}

export interface ClaimAnalysisEntry {
  readonly number: number;
  readonly summary: string;
  readonly strength: "strong" | "moderate" | "weak";
  readonly issues: readonly string[];
}

export interface ClaimAnalysis {
  readonly overallScore: number;
  readonly claims: readonly ClaimAnalysisEntry[];
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly recommendations: readonly string[];
}

export interface PatentabilityAssessment {
  readonly overallScore: number;
  readonly novelty: { readonly score: number; readonly reasoning: string };
  readonly nonObviousness: { readonly score: number; readonly reasoning: string };
  readonly utility: { readonly score: number; readonly reasoning: string };
  readonly risks: readonly string[];
  readonly recommendations: readonly string[];
}

export interface DeadlineRisk {
  readonly deadlineId: DeadlineId;
  readonly score: number;
  readonly factors: readonly string[];
}

export interface PriorArtResult {
  readonly id: PriorArtResultId;
  readonly assetId: AssetId;
  readonly organizationId: OrganizationId;
  readonly patentNumber: string;
  readonly title: string;
  readonly abstractText: string;
  readonly relevanceScore: number;
  readonly relevanceReasoning: string;
  readonly source: "uspto";
  readonly searchedAt: Date;
}
