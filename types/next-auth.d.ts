import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      googleSub?: string;
    };
  }

  interface User {
    googleSub?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    googleSub?: string;
  }
}
