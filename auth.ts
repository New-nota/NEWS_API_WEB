import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUserFromGoogleProfile } from "@/lib/users";
import type { AppError } from "@/lib/app-error";

type GoogleProfile = {
  sub?: string;
  email_verified?: boolean;
};

export const authConfig: NextAuthConfig = {
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return false;

      const googleProfile = profile as GoogleProfile | undefined;
      if (!googleProfile?.sub) return false;
      if (googleProfile.email_verified !== true) return false;
      if (!user.email) return false;

      try {
        const appUser = await upsertUserFromGoogleProfile({
          googleSub: googleProfile.sub,
          email: user.email,
          name: user.name ?? null,
          imageUrl: user.image ?? null,
        });

        user.googleSub = googleProfile.sub;
        user.appUserId = appUser.id;
        return true;
      } catch (error) {
        const appError = error as AppError | undefined;
        console.error("Failed to upsert user during sign-in", appError ?? error);
        return false;
      }
    },
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "google") {
        const googleProfile = profile as GoogleProfile | undefined;
        if (googleProfile?.sub) {
          token.googleSub = googleProfile.sub;
        }
      }
      if (typeof user?.appUserId === "number") {
        token.appUserId = user.appUserId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.googleSub === "string") {
        session.user.googleSub = token.googleSub;
      }
      if (session.user && typeof token.appUserId === "number") {
        session.user.appUserId = token.appUserId;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
