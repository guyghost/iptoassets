import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import type { Result, UserId, OrganizationId } from "@ipms/shared";
import { ok, err } from "@ipms/shared";

export function resultToResponse<T>(result: Result<T>, status = 200) {
  if (result.ok) {
    return json(result.value, { status });
  }
  return json({ error: result.error }, { status: 400 });
}

export interface AuthContext {
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
}

export async function requireAuth(event: RequestEvent): Promise<Result<AuthContext>> {
  const session = await event.locals.auth();
  if (!session?.user) {
    return err("Not authenticated");
  }

  const userId = (session as any).userId as UserId | undefined;
  const organizationId = (session as any).activeOrganizationId as OrganizationId | undefined;

  if (!userId) return err("Not authenticated");
  if (!organizationId) return err("No organization selected");

  return ok({ userId, organizationId });
}

export function unauthorizedResponse(error: string) {
  return json({ error }, { status: 401 });
}
