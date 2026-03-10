import type { RequestHandler } from "./$types";
import { listInvitations, createInvitation } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);
  const forbidden = requirePermission(auth.value, "member:invite");
  if (forbidden) return forbidden;

  const result = await listInvitations(auth.value.organizationId);
  return resultToResponse(result);
};

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);
  const forbidden = requirePermission(auth.value, "member:invite");
  if (forbidden) return forbidden;

  const body = await event.request.json();
  const result = await createInvitation({
    organizationId: auth.value.organizationId,
    invitedByUserId: auth.value.userId,
    email: body.email,
    role: body.role,
  });
  return resultToResponse(result, 201);
};
