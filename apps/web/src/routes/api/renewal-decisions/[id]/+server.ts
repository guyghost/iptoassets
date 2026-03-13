import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, unauthorizedResponse, requirePermission, resultToResponse } from "$lib/server/api-utils";
import { getRenewalDecision, makeRenewalDecision } from "$lib/server/use-cases";
import { parseRenewalDecisionId } from "@ipms/shared";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "renewal-decision:read");
  if (forbidden) return forbidden;

  const idResult = parseRenewalDecisionId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await getRenewalDecision(idResult.value, auth.value.organizationId);
  return resultToResponse(result);
};

export const PATCH: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "renewal-decision:write");
  if (forbidden) return forbidden;

  const idResult = parseRenewalDecisionId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const body = await event.request.json();
  const { decision, notes } = body;
  if (decision !== "renew" && decision !== "abandon") {
    return json({ error: "Decision must be 'renew' or 'abandon'" }, { status: 400 });
  }

  const result = await makeRenewalDecision(idResult.value, auth.value.organizationId, decision, auth.value.userId, notes ?? null);
  return resultToResponse(result);
};
