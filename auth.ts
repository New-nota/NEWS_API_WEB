import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUserFromGoogleProfile } from "@/lib/users";

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
      //if (googleProfile.email_verified !== true) return false;
      if (!user.email) return false;

      await upsertUserFromGoogleProfile({
        googleSub: googleProfile.sub,
        email: user.email,
        name: user.name ?? null,
        imageUrl: user.image ?? null,
      });
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "google") {
        const googleProfile = profile as GoogleProfile | undefined;
        if (googleProfile?.sub) {
          token.googleSub = googleProfile.sub;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.googleSub === "string") {
        session.user.googleSub = token.googleSub;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
