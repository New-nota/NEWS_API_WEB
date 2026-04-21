import { auth } from "@/auth";
import { getAnalyticsForUser } from "@/lib/analytics";
import { getUserByGoogleSub } from "@/lib/users";
import type { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";

export const GET = auth(async function GET(req: NextAuthRequest) {
  if (!req.auth?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const googleSub = req.auth.user.googleSub;
  if (!googleSub) {
    return NextResponse.json({ message: "Google identity is missing in session" }, { status: 401 });
  }

  const appUser = await getUserByGoogleSub(googleSub);
  if (!appUser) {
    return NextResponse.json({ message: "User is not provisioned" }, { status: 403 });
  }

  const data = await getAnalyticsForUser(appUser.id);
  return NextResponse.json(data);
});
