import {
  createAssetUseCase,
  getAssetUseCase,
  listAssetsUseCase,
  updateAssetStatusUseCase,
  deleteAssetUseCase,
  createDeadlineUseCase,
  listDeadlinesByAssetUseCase,
  completeDeadlineUseCase,
  createPortfolioUseCase,
  getPortfolioUseCase,
  listPortfoliosUseCase,
  addAssetToPortfolioUseCase,
  removeAssetFromPortfolioUseCase,
  deletePortfolioUseCase,
  createDocumentUseCase,
  updateDocumentStatusUseCase,
  deleteDocumentUseCase,
  listAssetsFilteredUseCase,
  computePortfolioMetricsUseCase,
  computeDeadlineMetricsUseCase,
  getAssetTimelineUseCase,
  bulkUpdateAssetStatusUseCase,
  bulkAddAssetsToPortfolioUseCase,
} from "@ipms/application";
import { assetRepo, deadlineRepo, documentRepo, portfolioRepo, statusChangeEventRepo } from "./repositories.js";

export const createAsset = createAssetUseCase(assetRepo);
export const getAsset = getAssetUseCase(assetRepo);
export const listAssets = listAssetsUseCase(assetRepo);
export const updateAssetStatus = updateAssetStatusUseCase(assetRepo, statusChangeEventRepo);
export const deleteAsset = deleteAssetUseCase(assetRepo);

export const createDeadline = createDeadlineUseCase(deadlineRepo);
export const listDeadlinesByAsset = listDeadlinesByAssetUseCase(deadlineRepo);
export const completeDeadline = completeDeadlineUseCase(deadlineRepo);

export const createPortfolio = createPortfolioUseCase(portfolioRepo);
export const getPortfolio = getPortfolioUseCase(portfolioRepo);
export const listPortfolios = listPortfoliosUseCase(portfolioRepo);
export const addAssetToPortfolio = addAssetToPortfolioUseCase(portfolioRepo);
export const removeAssetFromPortfolio = removeAssetFromPortfolioUseCase(portfolioRepo);
export const deletePortfolio = deletePortfolioUseCase(portfolioRepo);

export const createDocument = createDocumentUseCase(documentRepo);
export const updateDocumentStatus = updateDocumentStatusUseCase(documentRepo);
export const deleteDocument = deleteDocumentUseCase(documentRepo);

export const listAssetsFiltered = listAssetsFilteredUseCase(assetRepo);
export const computePortfolioMetrics = computePortfolioMetricsUseCase(assetRepo);
export const computeDeadlineMetrics = computeDeadlineMetricsUseCase(deadlineRepo);
export const getAssetTimeline = getAssetTimelineUseCase(statusChangeEventRepo);

export const bulkUpdateAssetStatus = bulkUpdateAssetStatusUseCase(assetRepo, statusChangeEventRepo);
export const bulkAddAssetsToPortfolio = bulkAddAssetsToPortfolioUseCase(portfolioRepo);
