import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { listPortfolios, createPortfolio } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parsePortfolioId } from "@ipms/shared";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "portfolio:read");
  if (forbidden) return forbidden;

  const result = await listPortfolios(auth.value.organizationId);
  return resultToResponse(result);
};

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "portfolio:create");
  if (forbidden) return forbidden;

  const { request } = event;
  const body = await request.json();

  const idResult = parsePortfolioId(body.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await createPortfolio({
    id: idResult.value,
    name: body.name,
    description: body.description ?? "",
    owner: body.owner,
    organizationId: auth.value.organizationId,
  });

  return resultToResponse(result, 201);
};
