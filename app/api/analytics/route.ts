import { auth } from "@/auth";
import { getAnalytics } from "@/lib/analytics";
import { NextResponse } from "next/server";

export const GET = auth(async function GET(req) {
  if (!req.auth?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const data = await getAnalytics();
  return NextResponse.json(data);
});
