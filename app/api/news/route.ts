import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";
import { listNewsForUser } from "@/lib/news";
import { parseNewsFiltersFromUrl } from "@/lib/news-filters";
import { getRequestId, handleApiError, jsonOk } from "@/lib/api-response";
import { requireAppUserIdFromAuthRequest } from "@/lib/api-auth";

export const GET = auth(async function GET(request: NextAuthRequest) {
  const requestId = getRequestId(request);

  try {
    const appUserIdOrResponse = await requireAppUserIdFromAuthRequest(request, requestId);
    if (appUserIdOrResponse instanceof Response) {
      return appUserIdOrResponse;
    }

    const filters = parseNewsFiltersFromUrl(request.url);
    const data = await listNewsForUser(appUserIdOrResponse, filters);

    return jsonOk(requestId, data);
  } catch (error) {
    return handleApiError(error, requestId);
  }
});
