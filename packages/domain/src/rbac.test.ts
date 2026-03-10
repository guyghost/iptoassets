import { describe, it, expect } from "vitest";
import { hasPermission, ROLE_HIERARCHY } from "./rbac.js";

describe("ROLE_HIERARCHY", () => {
  it("ranks viewer lowest", () => {
    expect(ROLE_HIERARCHY.viewer).toBeLessThan(ROLE_HIERARCHY.attorney);
  });
  it("ranks admin highest", () => {
    expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.manager);
  });
});

describe("hasPermission", () => {
  it("viewer can view assets", () => { expect(hasPermission("viewer", "asset:read")).toBe(true); });
  it("viewer cannot create assets", () => { expect(hasPermission("viewer", "asset:create")).toBe(false); });
  it("viewer cannot manage org", () => { expect(hasPermission("viewer", "org:manage")).toBe(false); });
  it("attorney can create assets", () => { expect(hasPermission("attorney", "asset:create")).toBe(true); });
  it("attorney can create documents", () => { expect(hasPermission("attorney", "document:create")).toBe(true); });
  it("attorney cannot create portfolios", () => { expect(hasPermission("attorney", "portfolio:create")).toBe(false); });
  it("manager can create portfolios", () => { expect(hasPermission("manager", "portfolio:create")).toBe(true); });
  it("manager can bulk operate", () => { expect(hasPermission("manager", "bulk:operate")).toBe(true); });
  it("manager can export", () => { expect(hasPermission("manager", "export:csv")).toBe(true); });
  it("manager can view audit", () => { expect(hasPermission("manager", "audit:read")).toBe(true); });
  it("manager cannot invite", () => { expect(hasPermission("manager", "member:invite")).toBe(false); });
  it("admin can invite", () => { expect(hasPermission("admin", "member:invite")).toBe(true); });
  it("admin can change roles", () => { expect(hasPermission("admin", "member:change-role")).toBe(true); });
  it("admin can manage org", () => { expect(hasPermission("admin", "org:manage")).toBe(true); });
});
