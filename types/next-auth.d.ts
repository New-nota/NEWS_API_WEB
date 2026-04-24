import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      googleSub?: string;
      appUserId?: number;
    };
  }

  interface User {
    googleSub?: string;
    appUserId?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    googleSub?: string;
    appUserId?: number;
  }
}
