import { env } from "$env/dynamic/private";
import type { AssetRepository, DeadlineRepository, DocumentRepository, PortfolioRepository, StatusChangeEventRepository, UserRepository, OrganizationRepository, MembershipRepository, AuditEventRepository, NotificationRepository, InvitationRepository, EmailService, AIService, EmbeddingService, AssetEmbeddingRepository, PatentSearchService, PriorArtResultRepository } from "@ipms/application";

let assetRepo: AssetRepository;
let deadlineRepo: DeadlineRepository;
let documentRepo: DocumentRepository;
let portfolioRepo: PortfolioRepository;
let statusChangeEventRepo: StatusChangeEventRepository;
let userRepo: UserRepository;
let orgRepo: OrganizationRepository;
let memberRepo: MembershipRepository;
let auditEventRepo: AuditEventRepository;
let notificationRepo: NotificationRepository;
let invitationRepo: InvitationRepository;
let emailService: EmailService;
let aiService: AIService;
let embeddingService: EmbeddingService;
let assetEmbeddingRepo: AssetEmbeddingRepository;
let patentSearchService: PatentSearchService;
let priorArtResultRepo: PriorArtResultRepository;

if (env.DATABASE_URL) {
  const { createDatabase, createPgAssetRepository, createPgDeadlineRepository, createPgDocumentRepository, createPgPortfolioRepository, createPgStatusChangeEventRepository, createPgUserRepository, createPgOrganizationRepository, createPgMembershipRepository, createPgAuditEventRepository, createPgNotificationRepository, createPgInvitationRepository } = await import("@ipms/infrastructure/postgres");
  const db = await createDatabase(env.DATABASE_URL);
  assetRepo = createPgAssetRepository(db);
  deadlineRepo = createPgDeadlineRepository(db);
  documentRepo = createPgDocumentRepository(db);
  portfolioRepo = createPgPortfolioRepository(db);
  statusChangeEventRepo = createPgStatusChangeEventRepository(db);
  userRepo = createPgUserRepository(db);
  orgRepo = createPgOrganizationRepository(db);
  memberRepo = createPgMembershipRepository(db);
  auditEventRepo = createPgAuditEventRepository(db);
  notificationRepo = createPgNotificationRepository(db);
  invitationRepo = createPgInvitationRepository(db);

  if (env.RESEND_API_KEY && env.RESEND_FROM_ADDRESS) {
    const { createResendEmailService } = await import("@ipms/infrastructure");
    emailService = createResendEmailService(env.RESEND_API_KEY, env.RESEND_FROM_ADDRESS);
  } else {
    const { createNoOpEmailService } = await import("@ipms/infrastructure");
    emailService = createNoOpEmailService();
  }

  if (env.ANTHROPIC_API_KEY) {
    const { createClaudeAIService } = await import("@ipms/infrastructure");
    aiService = createClaudeAIService(env.ANTHROPIC_API_KEY);
  } else {
    const { createNoOpAIService } = await import("@ipms/infrastructure");
    aiService = createNoOpAIService();
  }

  if (env.VOYAGE_API_KEY) {
    const { createVoyageEmbeddingService } = await import("@ipms/infrastructure/voyage");
    embeddingService = createVoyageEmbeddingService(env.VOYAGE_API_KEY);
  } else {
    const { createNoOpEmbeddingService } = await import("@ipms/infrastructure");
    embeddingService = createNoOpEmbeddingService();
  }

  const { createPgAssetEmbeddingRepository } = await import("@ipms/infrastructure/postgres");
  assetEmbeddingRepo = createPgAssetEmbeddingRepository(db);

  const { createUSPTOPatentSearchService } = await import("@ipms/infrastructure");
  patentSearchService = createUSPTOPatentSearchService();

  const { createPgPriorArtResultRepository } = await import("@ipms/infrastructure/postgres");
  priorArtResultRepo = createPgPriorArtResultRepository(db);

  // Seed dev data if not already present
  const { dev } = await import("$app/environment");
  if (dev) {
    const { seedData } = await import("./seed.js");
    seedData().catch((e: unknown) => console.warn("[seed]", e));
  }
} else {
  const { createInMemoryAssetRepository, createInMemoryDeadlineRepository, createInMemoryDocumentRepository, createInMemoryPortfolioRepository, createInMemoryStatusChangeEventRepository, createInMemoryUserRepository, createInMemoryOrganizationRepository, createInMemoryMembershipRepository, createInMemoryAuditEventRepository, createInMemoryNotificationRepository, createInMemoryInvitationRepository } = await import("@ipms/infrastructure");
  assetRepo = createInMemoryAssetRepository();
  deadlineRepo = createInMemoryDeadlineRepository();
  documentRepo = createInMemoryDocumentRepository();
  portfolioRepo = createInMemoryPortfolioRepository();
  statusChangeEventRepo = createInMemoryStatusChangeEventRepository();
  userRepo = createInMemoryUserRepository();
  orgRepo = createInMemoryOrganizationRepository();
  memberRepo = createInMemoryMembershipRepository();
  auditEventRepo = createInMemoryAuditEventRepository();
  notificationRepo = createInMemoryNotificationRepository();
  invitationRepo = createInMemoryInvitationRepository();

  const { createNoOpEmailService: createNoOp } = await import("@ipms/infrastructure");
  emailService = createNoOp();

  const { createNoOpAIService: createNoOpAI, createNoOpEmbeddingService: createNoOpEmbed, createInMemoryAssetEmbeddingRepository } = await import("@ipms/infrastructure");
  aiService = createNoOpAI();
  embeddingService = createNoOpEmbed();
  assetEmbeddingRepo = createInMemoryAssetEmbeddingRepository();

  const { createNoOpPatentSearchService, createInMemoryPriorArtResultRepository: createInMemoryPriorArt } = await import("@ipms/infrastructure");
  patentSearchService = createNoOpPatentSearchService();
  priorArtResultRepo = createInMemoryPriorArt();

  const { seedData } = await import("./seed.js");
  seedData();
}

export { assetRepo, deadlineRepo, documentRepo, portfolioRepo, statusChangeEventRepo, userRepo, orgRepo, memberRepo, auditEventRepo, notificationRepo, invitationRepo, emailService, aiService, embeddingService, assetEmbeddingRepo, patentSearchService, priorArtResultRepo };
