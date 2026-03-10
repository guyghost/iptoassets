import { env } from "$env/dynamic/private";
import type { AssetRepository, DeadlineRepository, DocumentRepository, PortfolioRepository, StatusChangeEventRepository, UserRepository, OrganizationRepository, MembershipRepository } from "@ipms/application";

let assetRepo: AssetRepository;
let deadlineRepo: DeadlineRepository;
let documentRepo: DocumentRepository;
let portfolioRepo: PortfolioRepository;
let statusChangeEventRepo: StatusChangeEventRepository;
let userRepo: UserRepository;
let orgRepo: OrganizationRepository;
let memberRepo: MembershipRepository;

if (env.DATABASE_URL) {
  const { createDatabase, createPgAssetRepository, createPgDeadlineRepository, createPgDocumentRepository, createPgPortfolioRepository, createPgStatusChangeEventRepository, createPgUserRepository, createPgOrganizationRepository, createPgMembershipRepository } = await import("@ipms/infrastructure/postgres");
  const db = createDatabase(env.DATABASE_URL);
  assetRepo = createPgAssetRepository(db);
  deadlineRepo = createPgDeadlineRepository(db);
  documentRepo = createPgDocumentRepository(db);
  portfolioRepo = createPgPortfolioRepository(db);
  statusChangeEventRepo = createPgStatusChangeEventRepository(db);
  userRepo = createPgUserRepository(db);
  orgRepo = createPgOrganizationRepository(db);
  memberRepo = createPgMembershipRepository(db);
} else {
  const { createInMemoryAssetRepository, createInMemoryDeadlineRepository, createInMemoryDocumentRepository, createInMemoryPortfolioRepository, createInMemoryStatusChangeEventRepository, createInMemoryUserRepository, createInMemoryOrganizationRepository, createInMemoryMembershipRepository } = await import("@ipms/infrastructure");
  assetRepo = createInMemoryAssetRepository();
  deadlineRepo = createInMemoryDeadlineRepository();
  documentRepo = createInMemoryDocumentRepository();
  portfolioRepo = createInMemoryPortfolioRepository();
  statusChangeEventRepo = createInMemoryStatusChangeEventRepository();
  userRepo = createInMemoryUserRepository();
  orgRepo = createInMemoryOrganizationRepository();
  memberRepo = createInMemoryMembershipRepository();

  const { seedData } = await import("./seed.js");
  seedData();
}

export { assetRepo, deadlineRepo, documentRepo, portfolioRepo, statusChangeEventRepo, userRepo, orgRepo, memberRepo };
