import { AppError } from "@/lib/app-error";
import { requireCurrentAppUserId } from "@/lib/api-auth";
import { getRequestId, handleApiError, jsonOk } from "@/lib/api-response";
import { ensureSameOrigin } from "@/lib/request-security";
import {
  deleteNewsApiKeyForUser,
  getNewsApiKeyStatusForUser,
  saveNewsApiKeyForUser,
} from "@/lib/user-news-api-key";
import { parseRequiredText } from "@/lib/validation";

const NEWS_API_KEY_MAX_LENGTH = 256;
const NEWS_API_KEY_MIN_LENGTH = 20;

function parseNewsApiKey(input: unknown) {
  const apiKey = parseRequiredText(input, {
    field: "apiKey",
    maxLength: NEWS_API_KEY_MAX_LENGTH,
  });

  if (apiKey.length < NEWS_API_KEY_MIN_LENGTH) {
    throw new AppError(400, "VALIDATION_ERROR", "apiKey is too short");
  }

  return apiKey;
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const appUserIdOrResponse = await requireCurrentAppUserId(requestId);
    if (appUserIdOrResponse instanceof Response) {
      return appUserIdOrResponse;
    }

    const status = await getNewsApiKeyStatusForUser(appUserIdOrResponse);
    return jsonOk(requestId, status);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const appUserIdOrResponse = await requireCurrentAppUserId(requestId);
    if (appUserIdOrResponse instanceof Response) {
      return appUserIdOrResponse;
    }

    ensureSameOrigin(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AppError(400, "INVALID_JSON", "Request body must be valid JSON");
    }

    const payload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const apiKey = parseNewsApiKey(payload.apiKey);

    const status = await saveNewsApiKeyForUser(appUserIdOrResponse, apiKey);
    return jsonOk(requestId, status);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

export async function DELETE(request: Request) {
  const requestId = getRequestId(request);

  try {
    const appUserIdOrResponse = await requireCurrentAppUserId(requestId);
    if (appUserIdOrResponse instanceof Response) {
      return appUserIdOrResponse;
    }

    ensureSameOrigin(request);

    const status = await deleteNewsApiKeyForUser(appUserIdOrResponse);
    return jsonOk(requestId, status);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}