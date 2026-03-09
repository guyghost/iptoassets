import { describe, it, expect, beforeEach } from "vitest";
import { createAssetUseCase, getAssetUseCase, listAssetsUseCase, updateAssetStatusUseCase, deleteAssetUseCase } from "@ipms/application";
import { createInMemoryAssetRepository } from "./in-memory-asset-repository.js";
import type { AssetId, OrganizationId } from "@ipms/shared";
import type { CreateAssetInput } from "@ipms/domain";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const ASSET_ID = "660e8400-e29b-41d4-a716-446655440000" as AssetId;

const validInput: CreateAssetInput = {
  id: ASSET_ID,
  title: "Test Patent",
  type: "patent",
  jurisdiction: { code: "US", name: "United States" },
  owner: "Acme Corp",
  organizationId: ORG_ID,
};

describe("asset use cases", () => {
  let repo: ReturnType<typeof createInMemoryAssetRepository>;

  beforeEach(() => {
    repo = createInMemoryAssetRepository();
  });

  it("creates and retrieves an asset", async () => {
    const create = createAssetUseCase(repo);
    const get = getAssetUseCase(repo);

    const createResult = await create(validInput);
    expect(createResult.ok).toBe(true);

    const getResult = await get(ASSET_ID, ORG_ID);
    expect(getResult.ok).toBe(true);
    if (getResult.ok) {
      expect(getResult.value.title).toBe("Test Patent");
    }
  });

  it("lists assets for an organization", async () => {
    const create = createAssetUseCase(repo);
    const list = listAssetsUseCase(repo);

    await create(validInput);
    const result = await list(ORG_ID);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
    }
  });

  it("updates asset status", async () => {
    const create = createAssetUseCase(repo);
    const update = updateAssetStatusUseCase(repo);

    await create(validInput);
    const result = await update(ASSET_ID, ORG_ID, "filed");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("filed");
    }
  });

  it("deletes an asset", async () => {
    const create = createAssetUseCase(repo);
    const del = deleteAssetUseCase(repo);
    const get = getAssetUseCase(repo);

    await create(validInput);
    const deleteResult = await del(ASSET_ID, ORG_ID);
    expect(deleteResult.ok).toBe(true);

    const getResult = await get(ASSET_ID, ORG_ID);
    expect(getResult.ok).toBe(false);
  });

  it("returns error for non-existent asset", async () => {
    const get = getAssetUseCase(repo);
    const result = await get(ASSET_ID, ORG_ID);
    expect(result).toEqual({ ok: false, error: "Asset not found" });
  });
});
