import { auth } from "@/auth";
import { listNewsForUser } from "@/lib/news";
import { getUserByGoogleSub } from "@/lib/users";
import type { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";

function asSingleValue(value: string | null) {
  return value ?? undefined;
}

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

  const { searchParams } = new URL(req.url);
  const data = await listNewsForUser(appUser.id, {
    q: asSingleValue(searchParams.get("q")),
    keyword: asSingleValue(searchParams.get("keyword")),
    author: asSingleValue(searchParams.get("author")),
    language: asSingleValue(searchParams.get("language")),
    page: Number(searchParams.get("page") ?? 1),
    limit: Number(searchParams.get("limit") ?? 20),
  });

  return NextResponse.json(data);
});
