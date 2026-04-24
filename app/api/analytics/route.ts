import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";
import { getAnalyticsForUser } from "@/lib/analytics";
import { getRequestId, handleApiError, jsonOk } from "@/lib/api-response";
import { requireAppUserIdFromAuthRequest } from "@/lib/api-auth";

export const GET = auth(async function GET(request: NextAuthRequest) {
  const requestId = getRequestId(request);

  try {
    const appUserIdOrResponse = await requireAppUserIdFromAuthRequest(request, requestId);
    if (appUserIdOrResponse instanceof Response) {
      return appUserIdOrResponse;
    }

    const data = await getAnalyticsForUser(appUserIdOrResponse);
    return jsonOk(requestId, data);
  } catch (error) {
    return handleApiError(error, requestId);
  }
});
