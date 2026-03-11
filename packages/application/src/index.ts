export type {
  AssetRepository,
  DeadlineRepository,
  DocumentRepository,
  PortfolioRepository,
  StatusChangeEventRepository,
  UserRepository,
  OrganizationRepository,
  MembershipRepository,
  AuditEventRepository,
  NotificationRepository,
  InvitationRepository,
  EmailService,
  AIService,
  EmbeddingService,
  AssetEmbeddingRepository,
} from "./ports.js";

export {
  createAssetUseCase,
  getAssetUseCase,
  listAssetsUseCase,
  updateAssetStatusUseCase,
  deleteAssetUseCase,
  listAssetsFilteredUseCase,
} from "./use-cases/asset.js";

export {
  createDeadlineUseCase,
  listDeadlinesByAssetUseCase,
  completeDeadlineUseCase,
} from "./use-cases/deadline.js";

export {
  createDocumentUseCase,
  updateDocumentStatusUseCase,
  deleteDocumentUseCase,
} from "./use-cases/document.js";

export {
  createPortfolioUseCase,
  getPortfolioUseCase,
  listPortfoliosUseCase,
  addAssetToPortfolioUseCase,
  removeAssetFromPortfolioUseCase,
  deletePortfolioUseCase,
} from "./use-cases/portfolio.js";

export {
  computePortfolioMetricsUseCase,
  computeDeadlineMetricsUseCase,
} from "./use-cases/analytics.js";

export { getAssetTimelineUseCase } from "./use-cases/timeline.js";

export {
  bulkUpdateAssetStatusUseCase,
  bulkAddAssetsToPortfolioUseCase,
} from "./use-cases/bulk.js";

export { exportAssetsCSVUseCase } from "./use-cases/export.js";

export { classifyDocumentUseCase } from "./use-cases/classify.js";

export { analyzeClaimsUseCase, assessPatentabilityUseCase } from "./use-cases/patent-analysis.js";

export {
  indexAssetEmbeddingUseCase,
  reindexAllAssetsUseCase,
  searchAssetsUseCase,
} from "./use-cases/search.js";

export {
  signInOrRegisterUseCase,
  createOrganizationUseCase,
  listUserOrganizationsUseCase,
} from "./use-cases/auth.js";
export type { SignInInput, CreateOrgInput } from "./use-cases/auth.js";

export { logAuditEventUseCase, listAuditEventsUseCase } from "./use-cases/audit.js";
export type { LogAuditInput } from "./use-cases/audit.js";

export {
  listNotificationsUseCase,
  markNotificationReadUseCase,
  markAllNotificationsReadUseCase,
  checkDeadlineNotificationsUseCase,
} from "./use-cases/notification.js";

export {
  createInvitationUseCase,
  listInvitationsUseCase,
  deleteInvitationUseCase,
  acceptPendingInvitationsUseCase,
} from "./use-cases/invitation.js";
export type { CreateInvitationUseCaseInput } from "./use-cases/invitation.js";
