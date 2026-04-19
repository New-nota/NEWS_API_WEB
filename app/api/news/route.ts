import { auth } from "@/auth";
import { listNews } from "@/lib/news";
import { NextResponse } from "next/server";

function asSingleValue(value: string | null) {
  return value ?? undefined;
}

export const GET = auth(async function GET(req) {
  if (!req.auth?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const data = await listNews({
    q: asSingleValue(searchParams.get("q")),
    keyword: asSingleValue(searchParams.get("keyword")),
    author: asSingleValue(searchParams.get("author")),
    language: asSingleValue(searchParams.get("language")),
    page: Number(searchParams.get("page") ?? 1),
    limit: Number(searchParams.get("limit") ?? 20),
  });

  return NextResponse.json(data);
});
