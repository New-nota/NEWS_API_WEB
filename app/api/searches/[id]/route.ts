import { getSearchRequestByIdForUser } from "@/lib/searches";
import { getRequestId, handleApiError, jsonError, jsonOk } from "@/lib/api-response";
import { requireCurrentAppUserId } from "@/lib/api-auth";
import { parseStrictPositiveInteger } from "@/lib/validation";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(_request);

  try {
    const appUserIdOrResponse = await requireCurrentAppUserId(requestId);
    if (appUserIdOrResponse instanceof Response) {
      return appUserIdOrResponse;
    }

    const { id } = await context.params;
    const searchRequestId = parseStrictPositiveInteger(id, "id");

    const row = await getSearchRequestByIdForUser(searchRequestId, appUserIdOrResponse);
    if (!row) {
      return jsonError(requestId, 404, "NOT_FOUND", "Search request not found");
    }

    return jsonOk(requestId, row);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
