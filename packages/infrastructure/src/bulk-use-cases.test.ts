import { describe, it, expect, beforeEach } from "vitest";
import { createAssetUseCase, bulkUpdateAssetStatusUseCase, bulkAddAssetsToPortfolioUseCase, createPortfolioUseCase, updateAssetStatusUseCase } from "@ipms/application";
import { createInMemoryAssetRepository } from "./in-memory-asset-repository.js";
import { createInMemoryStatusChangeEventRepository } from "./in-memory-status-change-event-repository.js";
import { createInMemoryPortfolioRepository } from "./in-memory-portfolio-repository.js";
import type { AssetId, OrganizationId, PortfolioId } from "@ipms/shared";
import type { CreateAssetInput } from "@ipms/domain";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const ASSET_1 = "a0000000-0000-0000-0000-000000000001" as AssetId;
const ASSET_2 = "a0000000-0000-0000-0000-000000000002" as AssetId;
const ASSET_3 = "a0000000-0000-0000-0000-000000000003" as AssetId;
const PORTFOLIO_ID = "b0000000-0000-0000-0000-000000000001" as PortfolioId;

const makeInput = (id: AssetId): CreateAssetInput => ({
  id,
  title: `Asset ${id.slice(-1)}`,
  type: "patent",
  jurisdiction: { code: "US", name: "United States" },
  owner: "Owner",
  organizationId: ORG_ID,
});

describe("bulkUpdateAssetStatusUseCase", () => {
  let assetRepo: ReturnType<typeof createInMemoryAssetRepository>;
  let eventRepo: ReturnType<typeof createInMemoryStatusChangeEventRepository>;

  beforeEach(async () => {
    assetRepo = createInMemoryAssetRepository();
    eventRepo = createInMemoryStatusChangeEventRepository();
    const create = createAssetUseCase(assetRepo);
    await create(makeInput(ASSET_1));
    await create(makeInput(ASSET_2));
    await create(makeInput(ASSET_3));
  });

  it("updates all valid assets", async () => {
    const bulkUpdate = bulkUpdateAssetStatusUseCase(assetRepo, eventRepo);
    const result = await bulkUpdate([ASSET_1, ASSET_2, ASSET_3], ORG_ID, "filed", "Alex");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.succeeded).toBe(3);
      expect(result.value.failed).toBe(0);
    }
  });

  it("reports errors for invalid transitions", async () => {
    const update = updateAssetStatusUseCase(assetRepo, eventRepo);
    await update(ASSET_1, ORG_ID, "filed", "Alex");

    const bulkUpdate = bulkUpdateAssetStatusUseCase(assetRepo, eventRepo);
    const result = await bulkUpdate([ASSET_1, ASSET_2, ASSET_3], ORG_ID, "filed", "Alex");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.succeeded).toBe(2);
      expect(result.value.failed).toBe(1);
      expect(result.value.errors[0]!.id).toBe(ASSET_1);
    }
  });

  it("creates status change events for successful updates", async () => {
    const bulkUpdate = bulkUpdateAssetStatusUseCase(assetRepo, eventRepo);
    await bulkUpdate([ASSET_1, ASSET_2], ORG_ID, "filed", "Alex");

    const events1 = await eventRepo.findByAssetId(ASSET_1, ORG_ID);
    const events2 = await eventRepo.findByAssetId(ASSET_2, ORG_ID);
    expect(events1).toHaveLength(1);
    expect(events2).toHaveLength(1);
  });
});

describe("bulkAddAssetsToPortfolioUseCase", () => {
  let assetRepo: ReturnType<typeof createInMemoryAssetRepository>;
  let portfolioRepo: ReturnType<typeof createInMemoryPortfolioRepository>;

  beforeEach(async () => {
    assetRepo = createInMemoryAssetRepository();
    portfolioRepo = createInMemoryPortfolioRepository();
    const create = createAssetUseCase(assetRepo);
    await create(makeInput(ASSET_1));
    await create(makeInput(ASSET_2));

    const createPort = createPortfolioUseCase(portfolioRepo);
    await createPort({
      id: PORTFOLIO_ID,
      name: "Test Portfolio",
      description: "Test",
      owner: "Owner",
      organizationId: ORG_ID,
    });
  });

  it("adds multiple assets to portfolio", async () => {
    const bulkAdd = bulkAddAssetsToPortfolioUseCase(portfolioRepo);
    const result = await bulkAdd(PORTFOLIO_ID, [ASSET_1, ASSET_2], ORG_ID);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.succeeded).toBe(2);
      expect(result.value.failed).toBe(0);
    }
  });

  it("reports errors for duplicate assets", async () => {
    const bulkAdd = bulkAddAssetsToPortfolioUseCase(portfolioRepo);
    await bulkAdd(PORTFOLIO_ID, [ASSET_1], ORG_ID);
    const result = await bulkAdd(PORTFOLIO_ID, [ASSET_1, ASSET_2], ORG_ID);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.succeeded).toBe(1);
      expect(result.value.failed).toBe(1);
    }
  });
});
