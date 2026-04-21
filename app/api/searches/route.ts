import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/users";
import { createSearchRequest } from "@/lib/searches";

const LIMIT_COUNT_MIN = 1;
const LIMIT_COUNT_MAX = 500;
const PAGE_SIZE_MIN = 1;
const PAGE_SIZE_MAX = 100;

export async function POST(request: Request) {
    const appUser = await getCurrentAppUser();
    if (!appUser) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const payload = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
    const keyword = String(payload.keyword ?? "").trim();
    const limitCount = Number(payload.limitCount ?? 20);
    const pageSize = Number(payload.pageSize ?? 50);
    const language = String(payload.language ?? "ru").trim().toLowerCase();

    if (!keyword) {
        return NextResponse.json({error: "Keyword is required"}, {status:400});
    }
    if (!/^[a-z]{2}$/.test(language)) {
        return NextResponse.json({ error: "Invalid language. Expected ISO 639-1 code, e.g. 'ru'" }, { status: 400 });
    }
    if(!Number.isInteger(limitCount) || limitCount < LIMIT_COUNT_MIN || limitCount > LIMIT_COUNT_MAX) {
        return NextResponse.json({ error: `Invalid limitCount. Expected ${LIMIT_COUNT_MIN}-${LIMIT_COUNT_MAX}` }, {status:400});
    }
    if (!Number.isInteger(pageSize) || pageSize < PAGE_SIZE_MIN || pageSize > PAGE_SIZE_MAX) {
        return NextResponse.json({ error: `Invalid pageSize. Expected ${PAGE_SIZE_MIN}-${PAGE_SIZE_MAX}`}, {status :  400});
    }

    const searchRequest = await createSearchRequest({
        userId: appUser.id,
        keyword,
        language,
        limitCount,
        pageSize,
    });
    return NextResponse.json(searchRequest, {status:201});
}
