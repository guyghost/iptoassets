import type { User } from "@ipms/domain";
import type { UserRepository } from "@ipms/application";

export function createInMemoryUserRepository(): UserRepository {
  const store = new Map<string, User>();

  return {
    async findById(id) {
      return store.get(id) ?? null;
    },

    async findByAuthProviderId(authProviderId) {
      return [...store.values()].find((u) => u.authProviderId === authProviderId) ?? null;
    },

    async findByEmail(email) {
      return [...store.values()].find((u) => u.email === email) ?? null;
    },

    async save(user) {
      store.set(user.id, user);
    },
  };
}
