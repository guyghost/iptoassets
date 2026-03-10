import type { InvitationId, OrganizationId } from "@ipms/shared";
import type { Invitation } from "@ipms/domain";
import type { InvitationRepository } from "@ipms/application";

export function createInMemoryInvitationRepository(): InvitationRepository {
  const store = new Map<string, Invitation>();

  return {
    async findById(id, orgId) {
      const inv = store.get(id);
      return inv && inv.organizationId === orgId ? inv : null;
    },
    async findByEmail(email) {
      return [...store.values()].filter((i) => i.email === email && i.status === "pending");
    },
    async findByOrganizationId(orgId) {
      return [...store.values()].filter((i) => i.organizationId === orgId);
    },
    async save(invitation) { store.set(invitation.id, invitation); },
    async delete(id, orgId) {
      const inv = store.get(id);
      if (inv && inv.organizationId === orgId) { store.delete(id); return true; }
      return false;
    },
  };
}
