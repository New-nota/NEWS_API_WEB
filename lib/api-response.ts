import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isAppError } from "@/lib/app-error";

export type ApiSuccessPayload<T> = {
  ok: true;
  data: T;
  requestId: string;
};

export type ApiErrorPayload = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
};

export function getRequestId(request: Request): string {
  const incoming = request.headers.get("x-request-id")?.trim();
  return incoming && incoming.length > 0 ? incoming : randomUUID();
}

export function jsonOk<T>(requestId: string, data: T, status = 200) {
  return NextResponse.json<ApiSuccessPayload<T>>(
    {
      ok: true,
      data,
      requestId,
    },
    { status },
  );
}

export function jsonError(
  requestId: string,
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return NextResponse.json<ApiErrorPayload>(
    {
      ok: false,
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
      requestId,
    },
    { status },
  );
}

export function handleApiError(error: unknown, requestId: string) {
  if (isAppError(error)) {
    if (error.status >= 500) {
      console.error(`[${requestId}] ${error.code}: ${error.message}`, error.details);
    }
    return jsonError(requestId, error.status, error.code, error.message, error.details);
  }

  const unknownError = error as Error | undefined;
  console.error(`[${requestId}] INTERNAL_ERROR`, unknownError);

  return jsonError(
    requestId,
    500,
    "INTERNAL_ERROR",
    "Unexpected server error. Please retry later.",
  );
}
