import type { UserId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { User } from "./entities.js";

export interface CreateUserInput {
  readonly id: UserId;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly authProviderId: string;
}

export function createUser(input: CreateUserInput): Result<User> {
  if (!input.email.trim()) return err("User email cannot be empty");
  if (!input.name.trim()) return err("User name cannot be empty");
  if (!input.authProviderId.trim()) return err("Auth provider ID cannot be empty");

  return ok({
    id: input.id,
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    avatarUrl: input.avatarUrl,
    authProviderId: input.authProviderId,
    createdAt: new Date(),
  });
}
