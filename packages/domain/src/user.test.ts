import { describe, it, expect } from "vitest";
import { createUser } from "./user.js";
import type { UserId } from "@ipms/shared";

const USER_ID = "550e8400-e29b-41d4-a716-446655440000" as UserId;

describe("createUser", () => {
  it("creates a user with valid input", () => {
    const result = createUser({
      id: USER_ID,
      email: "alice@example.com",
      name: "Alice Smith",
      avatarUrl: "https://example.com/avatar.png",
      authProviderId: "google-123",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBe("alice@example.com");
      expect(result.value.name).toBe("Alice Smith");
      expect(result.value.authProviderId).toBe("google-123");
    }
  });

  it("rejects empty email", () => {
    const result = createUser({ id: USER_ID, email: "  ", name: "Alice", avatarUrl: null, authProviderId: "google-123" });
    expect(result).toEqual({ ok: false, error: "User email cannot be empty" });
  });

  it("rejects empty name", () => {
    const result = createUser({ id: USER_ID, email: "alice@example.com", name: "  ", avatarUrl: null, authProviderId: "google-123" });
    expect(result).toEqual({ ok: false, error: "User name cannot be empty" });
  });

  it("rejects empty authProviderId", () => {
    const result = createUser({ id: USER_ID, email: "alice@example.com", name: "Alice", avatarUrl: null, authProviderId: "" });
    expect(result).toEqual({ ok: false, error: "Auth provider ID cannot be empty" });
  });
});
