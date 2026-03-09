import { describe, it, expect } from "vitest";
import {
  parseAssetId,
  parseDeadlineId,
  parseDocumentId,
  parsePortfolioId,
  parseOrganizationId,
} from "./validation.js";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("parseAssetId", () => {
  it("accepts a valid UUID", () => {
    const result = parseAssetId(VALID_UUID);
    expect(result).toEqual({ ok: true, value: VALID_UUID });
  });

  it("rejects an invalid string", () => {
    const result = parseAssetId("not-a-uuid");
    expect(result.ok).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = parseAssetId("");
    expect(result.ok).toBe(false);
  });
});

describe("parseDeadlineId", () => {
  it("accepts a valid UUID", () => {
    expect(parseDeadlineId(VALID_UUID).ok).toBe(true);
  });
});

describe("parseDocumentId", () => {
  it("accepts a valid UUID", () => {
    expect(parseDocumentId(VALID_UUID).ok).toBe(true);
  });
});

describe("parsePortfolioId", () => {
  it("accepts a valid UUID", () => {
    expect(parsePortfolioId(VALID_UUID).ok).toBe(true);
  });
});

describe("parseOrganizationId", () => {
  it("accepts a valid UUID", () => {
    expect(parseOrganizationId(VALID_UUID).ok).toBe(true);
  });
});
