import { createSearchRequest } from "@/lib/searches";
import { AppError } from "@/lib/app-error";
import { hasNewsApiKeyForUser } from "@/lib/user-news-api-key";
import { getRequestId, handleApiError, jsonError, jsonOk } from "@/lib/api-response";
import { requireCurrentAppUserId } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { ensureSameOrigin, getClientIp } from "@/lib/request-security";
import { parseLanguage, parseRequiredText, parseStrictPositiveInteger } from "@/lib/validation";
import { NEWS_TEXT_MAX_LENGTH } from "@/lib/news";

const LIMIT_COUNT_MIN = 1;
const LIMIT_COUNT_MAX = 500;
const PAGE_SIZE_MIN = 1;
const PAGE_SIZE_MAX = 100;

const SEARCH_REQUEST_RATE_LIMIT = {
  windowMs: 60_000,
  maxRequests: 20,
};

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const appUserIdOrResponse = await requireCurrentAppUserId(requestId);
    if (appUserIdOrResponse instanceof Response) {
      return appUserIdOrResponse;
    }
    const appUserId = appUserIdOrResponse;
    const hasNewsApiKey = await hasNewsApiKeyForUser(appUserId);
    if (!hasNewsApiKey) {
      return jsonError(
        requestId,
        403,
        "NEWS_API_KEY_REQUIRED",
        "Add NewsAPI key in your profile before creating news requests",
        );
      }
    ensureSameOrigin(request);

    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`search:${appUserId}:${clientIp}`, SEARCH_REQUEST_RATE_LIMIT);
    if (!rateLimit.allowed) {
      return jsonError(requestId, 429, "RATE_LIMITED", "Too many requests", {
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AppError(400, "INVALID_JSON", "Request body must be valid JSON");
    }

    const payload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const keyword = parseRequiredText(payload.keyword, {
      field: "keyword",
      maxLength: NEWS_TEXT_MAX_LENGTH,
    });
    const language = parseLanguage(payload.language, "ru");
    const limitCount = parseStrictPositiveInteger(payload.limitCount ?? 20, "limitCount");
    const pageSize = parseStrictPositiveInteger(payload.pageSize ?? 50, "pageSize");

    if (limitCount < LIMIT_COUNT_MIN || limitCount > LIMIT_COUNT_MAX) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        `Invalid limitCount. Expected ${LIMIT_COUNT_MIN}-${LIMIT_COUNT_MAX}`,
      );
    }

    if (pageSize < PAGE_SIZE_MIN || pageSize > PAGE_SIZE_MAX) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        `Invalid pageSize. Expected ${PAGE_SIZE_MIN}-${PAGE_SIZE_MAX}`,
      );
    }

    const searchRequest = await createSearchRequest({
      userId: appUserId,
      keyword,
      language,
      limitCount,
      pageSize,
    });

    return jsonOk(requestId, searchRequest, 201);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
