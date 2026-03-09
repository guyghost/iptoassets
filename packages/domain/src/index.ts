export type { IPAsset, Deadline, Document, Portfolio, StatusChangeEvent } from "./entities.js";

export { createAsset, updateAssetStatus, validateStatusTransition, filterAssets } from "./asset.js";
export type { CreateAssetInput, AssetFilter } from "./asset.js";

export { createDeadline, completeDeadline } from "./deadline.js";
export type { CreateDeadlineInput } from "./deadline.js";

export { createDocument, updateDocumentStatus } from "./document.js";
export type { CreateDocumentInput } from "./document.js";

export {
  createPortfolio,
  addAssetToPortfolio,
  removeAssetFromPortfolio,
} from "./portfolio.js";
export type { CreatePortfolioInput } from "./portfolio.js";

export { createStatusChangeEvent } from "./status-change-event.js";
export type { CreateStatusChangeEventInput } from "./status-change-event.js";

export { computePortfolioMetrics } from "./analytics/index.js";
export type { PortfolioMetrics } from "./analytics/index.js";
