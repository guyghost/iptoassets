import { env } from "$env/dynamic/private";
import type { AssetRepository, DeadlineRepository, DocumentRepository, PortfolioRepository, StatusChangeEventRepository } from "@ipms/application";

let assetRepo: AssetRepository;
let deadlineRepo: DeadlineRepository;
let documentRepo: DocumentRepository;
let portfolioRepo: PortfolioRepository;
let statusChangeEventRepo: StatusChangeEventRepository;

if (env.DATABASE_URL) {
  const { createDatabase, createPgAssetRepository, createPgDeadlineRepository, createPgDocumentRepository, createPgPortfolioRepository, createPgStatusChangeEventRepository } = await import("@ipms/infrastructure/postgres");
  const db = createDatabase(env.DATABASE_URL);
  assetRepo = createPgAssetRepository(db);
  deadlineRepo = createPgDeadlineRepository(db);
  documentRepo = createPgDocumentRepository(db);
  portfolioRepo = createPgPortfolioRepository(db);
  statusChangeEventRepo = createPgStatusChangeEventRepository(db);
} else {
  const { createInMemoryAssetRepository, createInMemoryDeadlineRepository, createInMemoryDocumentRepository, createInMemoryPortfolioRepository, createInMemoryStatusChangeEventRepository } = await import("@ipms/infrastructure");
  assetRepo = createInMemoryAssetRepository();
  deadlineRepo = createInMemoryDeadlineRepository();
  documentRepo = createInMemoryDocumentRepository();
  portfolioRepo = createInMemoryPortfolioRepository();
  statusChangeEventRepo = createInMemoryStatusChangeEventRepository();

  const { seedData } = await import("./seed.js");
  seedData();
}

export { assetRepo, deadlineRepo, documentRepo, portfolioRepo, statusChangeEventRepo };
