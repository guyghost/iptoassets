import type { AssetId, DeadlineId, DocumentId, PortfolioId, OrganizationId, StatusChangeEventId } from "@ipms/shared";
import type { IPAsset, Deadline, Document, Portfolio, StatusChangeEvent } from "@ipms/domain";

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
