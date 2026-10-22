import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { Session } from "next-auth";

/**
 * Auth.js (next-auth v5) + Google.
 * Env (do not rename): AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_SECRET, AUTH_URL
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  trustHost: true,
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});

/** Prefer email; fall back to Google `sub` (session.user.id). */
export function bidderIdFromSession(session: Session): string | null {
  const email = session.user?.email?.trim();
  if (email) return email;
  const id = session.user?.id?.trim();
  if (id) return id;
  return null;
}
