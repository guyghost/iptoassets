import {
  createInMemoryAssetRepository,
  createInMemoryDeadlineRepository,
  createInMemoryDocumentRepository,
  createInMemoryPortfolioRepository,
  createInMemoryStatusChangeEventRepository,
} from "@ipms/infrastructure";

export const assetRepo = createInMemoryAssetRepository();
export const deadlineRepo = createInMemoryDeadlineRepository();
export const documentRepo = createInMemoryDocumentRepository();
export const portfolioRepo = createInMemoryPortfolioRepository();
export const statusChangeEventRepo = createInMemoryStatusChangeEventRepository();
