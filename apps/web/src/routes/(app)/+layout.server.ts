import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {
  const user = event.locals.betterAuthUser;
  if (!user) {
    throw redirect(303, "/login");
  }

  return {
    user: {
      id: event.locals.userId,
      name: user.name,
      email: user.email,
      avatarUrl: user.image ?? null,
    },
    role: event.locals.role ?? "viewer",
    organizationId: event.locals.activeOrganizationId,
    organizationName: event.locals.activeOrganizationName ?? "",
  };
};
