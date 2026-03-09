import type {
  AssetId,
  DeadlineId,
  DocumentId,
  PortfolioId,
  StatusChangeEventId,
  OrganizationId,
  IPType,
  AssetStatus,
  DeadlineType,
  DocumentType,
  DocumentStatus,
  Jurisdiction,
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
