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
  exportAssetsCSVUseCase,
  signInOrRegisterUseCase,
  createOrganizationUseCase,
  listUserOrganizationsUseCase,
  logAuditEventUseCase,
  listAuditEventsUseCase,
  listNotificationsUseCase,
  markNotificationReadUseCase,
  markAllNotificationsReadUseCase,
  checkDeadlineNotificationsUseCase,
  createInvitationUseCase,
  listInvitationsUseCase,
  deleteInvitationUseCase,
  acceptPendingInvitationsUseCase,
  indexAssetEmbeddingUseCase,
  reindexAllAssetsUseCase,
  searchAssetsUseCase,
  classifyDocumentUseCase,
} from "@ipms/application";
import { assetRepo, deadlineRepo, documentRepo, portfolioRepo, statusChangeEventRepo, userRepo, orgRepo, memberRepo, auditEventRepo, notificationRepo, invitationRepo, emailService, aiService, embeddingService, assetEmbeddingRepo } from "./repositories.js";

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
export const updateDocumentStatus = updateDocumentStatusUseCase(documentRepo, emailService, notificationRepo, memberRepo, userRepo);
export const deleteDocument = deleteDocumentUseCase(documentRepo);

export const listAssetsFiltered = listAssetsFilteredUseCase(assetRepo);
export const computePortfolioMetrics = computePortfolioMetricsUseCase(assetRepo);
export const computeDeadlineMetrics = computeDeadlineMetricsUseCase(deadlineRepo);
export const getAssetTimeline = getAssetTimelineUseCase(statusChangeEventRepo);

export const bulkUpdateAssetStatus = bulkUpdateAssetStatusUseCase(assetRepo, statusChangeEventRepo);
export const bulkAddAssetsToPortfolio = bulkAddAssetsToPortfolioUseCase(portfolioRepo);

export const exportAssetsCSV = exportAssetsCSVUseCase(assetRepo);

export const signInOrRegister = signInOrRegisterUseCase(userRepo);
export const createOrg = createOrganizationUseCase(orgRepo, memberRepo);
export const listUserOrganizations = listUserOrganizationsUseCase(orgRepo, memberRepo);

export const logAuditEvent = logAuditEventUseCase(auditEventRepo);
export const listAuditEvents = listAuditEventsUseCase(auditEventRepo);

export const listNotifications = listNotificationsUseCase(notificationRepo);
export const markNotificationRead = markNotificationReadUseCase(notificationRepo);
export const markAllNotificationsRead = markAllNotificationsReadUseCase(notificationRepo);
export const checkDeadlineNotifications = checkDeadlineNotificationsUseCase(deadlineRepo, notificationRepo, memberRepo, emailService, userRepo);

export const createInvitation = createInvitationUseCase(invitationRepo, emailService, orgRepo, userRepo);
export const listInvitations = listInvitationsUseCase(invitationRepo);
export const deleteInvitation = deleteInvitationUseCase(invitationRepo);
export const acceptPendingInvitations = acceptPendingInvitationsUseCase(invitationRepo, memberRepo);

export const indexAssetEmbedding = indexAssetEmbeddingUseCase(assetRepo, assetEmbeddingRepo, embeddingService);
export const reindexAllAssets = reindexAllAssetsUseCase(assetRepo, assetEmbeddingRepo, embeddingService);
export const searchAssets = searchAssetsUseCase(assetRepo, assetEmbeddingRepo, embeddingService);
export const classifyDocument = classifyDocumentUseCase(documentRepo, assetRepo, aiService);
