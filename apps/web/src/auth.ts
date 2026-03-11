import { SvelteKitAuth } from "@auth/sveltekit";
import Credentials from "@auth/sveltekit/providers/credentials";
import Google from "@auth/sveltekit/providers/google";
import MicrosoftEntraId from "@auth/sveltekit/providers/microsoft-entra-id";
import { env } from "$env/dynamic/private";
import { dev } from "$app/environment";

export const { handle, signIn, signOut } = SvelteKitAuth(async () => {
  const { signInOrRegister, listUserOrganizations, acceptPendingInvitations } = await import("$lib/server/use-cases");
  const { userRepo, memberRepo } = await import("$lib/server/repositories");

  const providers: any[] = [];

  if (env.GOOGLE_CLIENT_ID) {
    providers.push(Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }));
  }

  if (env.MICROSOFT_ISSUER) {
    providers.push(MicrosoftEntraId({
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
      issuer: env.MICROSOFT_ISSUER,
    }));
  }

  // Dev-only credentials provider for local development
  if (dev && providers.length === 0) {
    providers.push(Credentials({
      id: "dev-login",
      name: "Dev Login",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        if (!email) return null;
        // Return a minimal user object — signIn callback handles domain registration
        return { id: email, email, name: email.split("@")[0], image: null };
      },
    }));
  }

  return {
    providers,
    callbacks: {
      async signIn({ user, account }) {
        if (!account || !user.email || !user.name) return false;

        const result = await signInOrRegister({
          authProviderId: `${account.provider}:${account.providerAccountId}`,
          email: user.email,
          name: user.name,
          avatarUrl: user.image ?? null,
        });

        if (result.ok) {
          await acceptPendingInvitations(user.email, result.value.id);
        }

        return result.ok;
      },
      async session({ session, token }) {
        if (!session.user?.email) return session;

        const domainUser = await userRepo.findByEmail(session.user.email);
        if (domainUser) {
          (session as any).userId = domainUser.id;

          const orgsResult = await listUserOrganizations(domainUser.id);
          if (orgsResult.ok && orgsResult.value.length > 0) {
            (session as any).activeOrganizationId = orgsResult.value[0].id;

            const membership = await memberRepo.findByUserAndOrg(domainUser.id, orgsResult.value[0].id);
            if (membership) {
              (session as any).role = membership.role;
            }
          }
        }

        return session;
      },
    },
    pages: {
      signIn: "/login",
    },
    session: { strategy: "jwt" },
    trustHost: true,
  };
});
