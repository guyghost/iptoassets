import { eq } from "drizzle-orm";
import type { UserId } from "@ipms/shared";
import type { User } from "@ipms/domain";
import type { UserRepository } from "@ipms/application";
import { users } from "./schema.js";
import type { Database } from "./connection.js";

type UserRow = typeof users.$inferSelect;

function toEntity(row: UserRow): User {
  return {
    id: row.id as UserId,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatarUrl,
    authProviderId: row.authProviderId,
    createdAt: row.createdAt,
  };
}

export function createPgUserRepository(db: Database): UserRepository {
  return {
    async findById(id) {
      const rows = await db.select().from(users).where(eq(users.id, id));
      return rows[0] ? toEntity(rows[0]) : null;
    },
    async findByAuthProviderId(authProviderId) {
      const rows = await db.select().from(users).where(eq(users.authProviderId, authProviderId));
      return rows[0] ? toEntity(rows[0]) : null;
    },
    async findByEmail(email) {
      const rows = await db.select().from(users).where(eq(users.email, email));
      return rows[0] ? toEntity(rows[0]) : null;
    },
    async save(user) {
      await db.insert(users).values({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        authProviderId: user.authProviderId,
        createdAt: user.createdAt,
      }).onConflictDoUpdate({
        target: users.id,
        set: { email: user.email, name: user.name, avatarUrl: user.avatarUrl },
      });
    },
  };
}
