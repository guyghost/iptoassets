import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import type { Result, UserId, OrganizationId } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { MemberRole } from "@ipms/domain";
import { hasPermission } from "@ipms/domain";
import type { PermissionAction } from "@ipms/domain";

export function resultToResponse<T>(result: Result<T>, status = 200) {
  if (result.ok) {
    return json(result.value, { status });
  }
  return json({ error: result.error }, { status: 400 });
}

export interface AuthContext {
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
  readonly role: MemberRole;
}

export async function requireAuth(event: RequestEvent): Promise<Result<AuthContext>> {
  const session = await event.locals.auth();
  if (!session?.user) {
    return err("Not authenticated");
  }

  const userId = (session as any).userId as UserId | undefined;
  const organizationId = (session as any).activeOrganizationId as OrganizationId | undefined;
  const role = (session as any).role as MemberRole | undefined;

  if (!userId) return err("Not authenticated");
  if (!organizationId) return err("No organization selected");
  if (!role) return err("No role assigned");

  return ok({ userId, organizationId, role });
}

export function unauthorizedResponse(error: string) {
  return json({ error }, { status: 401 });
}

export function forbiddenResponse() {
  return json({ error: "Forbidden" }, { status: 403 });
}

export function requirePermission(auth: AuthContext, action: PermissionAction): Response | null {
  if (!hasPermission(auth.role, action)) return forbiddenResponse();
  return null;
}
