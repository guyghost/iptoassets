import { handle as authHandle } from "./auth";
import { redirect, type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

const protectRoutes: Handle = async ({ event, resolve }) => {
  if (
    event.url.pathname.startsWith("/auth") ||
    event.url.pathname === "/" ||
    event.url.pathname.startsWith("/api/auth")
  ) {
    return resolve(event);
  }

  const session = await event.locals.auth();
  if (!session?.user) {
    throw redirect(303, "/auth/signin");
  }

  return resolve(event);
};

export const handle = sequence(authHandle, protectRoutes);
