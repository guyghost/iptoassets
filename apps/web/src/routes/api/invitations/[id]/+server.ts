import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { deleteInvitation } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parseInvitationId } from "@ipms/shared";

export const DELETE: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);
  const forbidden = requirePermission(auth.value, "member:invite");
  if (forbidden) return forbidden;

  const idResult = parseInvitationId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await deleteInvitation(idResult.value, auth.value.organizationId);
  return resultToResponse(result);
};
