import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { createOrg, listUserOrganizations } from "$lib/server/use-cases";
import type { UserId } from "@ipms/shared";

export const load: PageServerLoad = async (event) => {
  const session = await event.locals.auth();
  const userId = (session as any)?.userId as UserId | undefined;
  if (!userId) throw redirect(303, "/auth/signin");

  const orgsResult = await listUserOrganizations(userId);
  if (orgsResult.ok && orgsResult.value.length > 0) {
    throw redirect(303, "/app");
  }
};

export const actions: Actions = {
  default: async (event) => {
    const session = await event.locals.auth();
    const userId = (session as any)?.userId as UserId | undefined;
    if (!userId) throw redirect(303, "/auth/signin");

    const formData = await event.request.formData();
    const name = formData.get("name") as string;

    const result = await createOrg({ name, ownerId: userId });
    if (!result.ok) {
      return { error: result.error };
    }

    throw redirect(303, "/app");
  },
};
