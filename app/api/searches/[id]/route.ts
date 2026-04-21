import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/users";
import { getSearchRequestByIdForUser } from "@/lib/searches";

export async function GET(
    _request: Request,
    context: {params: Promise<{id: string}>}
) {
    const appUser = await getCurrentAppUser();
    if (!appUser) {
        return NextResponse.json({error: "Unauthorized"}, {status:401});
    }
    const{ id } = await context.params;
    const searchRequestId = Number(id);
    if(!Number.isInteger(searchRequestId) || searchRequestId <= 0) {
        return NextResponse.json({error: "Invalid id"}, {status: 400});
    }
    const row = await getSearchRequestByIdForUser(searchRequestId, appUser.id);
    if (!row) {
        return NextResponse.json({ error: "Not found"}, {status : 404});
    }
    return NextResponse.json(row);
}