import type { AssetId, DeadlineId, DocumentId, PortfolioId, OrganizationId, StatusChangeEventId, UserId, MembershipId, AuditEventId, NotificationId, InvitationId } from "@ipms/shared";
import type { IPAsset, Deadline, Document, Portfolio, StatusChangeEvent, User, Organization, Membership, AuditEvent, Notification, Invitation } from "@ipms/domain";

export interface AssetRepository {
  findById(id: AssetId, orgId: OrganizationId): Promise<IPAsset | null>;
  findAll(orgId: OrganizationId): Promise<readonly IPAsset[]>;
  save(asset: IPAsset): Promise<void>;
  delete(id: AssetId, orgId: OrganizationId): Promise<boolean>;
}

export interface DeadlineRepository {
  findById(id: DeadlineId, orgId: OrganizationId): Promise<Deadline | null>;
  findByAssetId(assetId: AssetId, orgId: OrganizationId): Promise<readonly Deadline[]>;
  findAll(orgId: OrganizationId): Promise<readonly Deadline[]>;
  save(deadline: Deadline): Promise<void>;
  delete(id: DeadlineId, orgId: OrganizationId): Promise<boolean>;
}

export interface DocumentRepository {
  findById(id: DocumentId, orgId: OrganizationId): Promise<Document | null>;
  findByAssetId(assetId: AssetId, orgId: OrganizationId): Promise<readonly Document[]>;
  findAll(orgId: OrganizationId): Promise<readonly Document[]>;
  save(doc: Document): Promise<void>;
  delete(id: DocumentId, orgId: OrganizationId): Promise<boolean>;
}

export interface PortfolioRepository {
  findById(id: PortfolioId, orgId: OrganizationId): Promise<Portfolio | null>;
  findAll(orgId: OrganizationId): Promise<readonly Portfolio[]>;
  save(portfolio: Portfolio): Promise<void>;
  delete(id: PortfolioId, orgId: OrganizationId): Promise<boolean>;
}

export interface StatusChangeEventRepository {
  findByAssetId(assetId: AssetId, orgId: OrganizationId): Promise<readonly StatusChangeEvent[]>;
  findAll(orgId: OrganizationId): Promise<readonly StatusChangeEvent[]>;
  save(event: StatusChangeEvent): Promise<void>;
}

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByAuthProviderId(authProviderId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

export interface OrganizationRepository {
  findById(id: OrganizationId): Promise<Organization | null>;
  findByOwnerId(ownerId: UserId): Promise<readonly Organization[]>;
  save(org: Organization): Promise<void>;
}

export interface MembershipRepository {
  findByUserId(userId: UserId): Promise<readonly Membership[]>;
  findByOrganizationId(orgId: OrganizationId): Promise<readonly Membership[]>;
  findByUserAndOrg(userId: UserId, orgId: OrganizationId): Promise<Membership | null>;
  save(membership: Membership): Promise<void>;
}

export interface AuditEventRepository {
  findByOrganizationId(orgId: OrganizationId, options?: { entityType?: string; actorId?: UserId; limit?: number }): Promise<readonly AuditEvent[]>;
  save(event: AuditEvent): Promise<void>;
}

export interface NotificationRepository {
  findByRecipientId(recipientId: UserId, orgId: OrganizationId): Promise<readonly Notification[]>;
  findById(id: NotificationId, recipientId: UserId): Promise<Notification | null>;
  save(notification: Notification): Promise<void>;
  markAllRead(recipientId: UserId, orgId: OrganizationId): Promise<void>;
}

export interface InvitationRepository {
  findById(id: InvitationId, orgId: OrganizationId): Promise<Invitation | null>;
  findByEmail(email: string): Promise<readonly Invitation[]>;
  findByOrganizationId(orgId: OrganizationId): Promise<readonly Invitation[]>;
  save(invitation: Invitation): Promise<void>;
  delete(id: InvitationId, orgId: OrganizationId): Promise<boolean>;
}
