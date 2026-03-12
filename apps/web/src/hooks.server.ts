import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { redirect, type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import type { UserId } from "@ipms/shared";

const authHandler: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  if (session) {
    event.locals.betterAuthSession = session.session;
    event.locals.betterAuthUser = session.user;

    // Look up domain user and enrich with org/role info
    const { userRepo, memberRepo } = await import("$lib/server/repositories");
    const { listUserOrganizations } = await import("$lib/server/use-cases");

    const domainUser = await userRepo.findByEmail(session.user.email);
    if (domainUser) {
      event.locals.userId = domainUser.id;

      const orgsResult = await listUserOrganizations(domainUser.id);
      if (orgsResult.ok && orgsResult.value.length > 0) {
        event.locals.activeOrganizationId = orgsResult.value[0].id;

        const membership = await memberRepo.findByUserAndOrg(
          domainUser.id,
          orgsResult.value[0].id,
        );
        if (membership) {
          event.locals.role = membership.role;
        }
      }
    }
  }

  return svelteKitHandler({ event, resolve, auth, building });
};

const protectRoutes: Handle = async ({ event, resolve }) => {
  const isPublicRoute =
    event.url.pathname.startsWith("/api/auth") ||
    event.url.pathname.startsWith("/api/cron") ||
    event.url.pathname === "/";

  if (isPublicRoute) {
    return resolve(event);
  }

  // Redirect authenticated users away from login
  if (event.url.pathname.startsWith("/login") && event.locals.betterAuthUser) {
    throw redirect(303, "/dashboard");
  }

  // Allow login page for unauthenticated users
  if (event.url.pathname.startsWith("/login")) {
    return resolve(event);
  }

  // All other routes require authentication
  if (!event.locals.betterAuthUser) {
    throw redirect(303, "/login");
  }

  return resolve(event);
};

export const handle = sequence(authHandler, protectRoutes);
