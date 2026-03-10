import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createOrg, listUserOrganizations } from "$lib/server/use-cases";
import { requireAuth, unauthorizedResponse, resultToResponse } from "$lib/server/api-utils";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const result = await listUserOrganizations(auth.value.userId);
  return resultToResponse(result);
};

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const body = await event.request.json();
  const result = await createOrg({
    name: body.name,
    ownerId: auth.value.userId,
  });

  return resultToResponse(result, 201);
};
