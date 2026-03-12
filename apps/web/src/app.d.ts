import type { UserId, OrganizationId } from "@ipms/shared";
import type { MemberRole } from "@ipms/domain";

declare global {
  namespace App {
    interface Locals {
      betterAuthSession: any;
      betterAuthUser: any;
      userId?: UserId;
      activeOrganizationId?: OrganizationId;
      activeOrganizationName?: string;
      role?: MemberRole;
    }
  }
}

export {};
