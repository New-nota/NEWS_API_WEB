import type { NextAuthRequest } from "next-auth";
import { jsonError } from "@/lib/api-response";
import { getCurrentAppUserId, resolveAppUserIdFromSessionUser } from "@/lib/users";

export async function requireAppUserIdFromAuthRequest(
  request: NextAuthRequest,
  requestId: string,
): Promise<number | Response> {
  if (!request.auth?.user) {
    return jsonError(requestId, 401, "UNAUTHORIZED", "Authentication required");
  }

  const appUserId = await resolveAppUserIdFromSessionUser({
    appUserId: request.auth.user.appUserId,
    googleSub: request.auth.user.googleSub,
  });
  if (!appUserId) {
    return jsonError(requestId, 403, "FORBIDDEN", "User is not provisioned");
  }

  return appUserId;
}

export async function requireCurrentAppUserId(requestId: string): Promise<number | Response> {
  const appUserId = await getCurrentAppUserId();
  if (!appUserId) {
    return jsonError(requestId, 401, "UNAUTHORIZED", "Authentication required");
  }
  return appUserId;
}

