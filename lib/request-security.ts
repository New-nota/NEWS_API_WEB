import { AppError } from "@/lib/app-error";

function normalizeOrigin(value: string) {
  return value.replace(/\/$/, "");
}

export function ensureSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return;
  }

  let requestOrigin: string;
  try {
    requestOrigin = new URL(request.url).origin;
  } catch {
    throw new AppError(400, "BAD_REQUEST", "Invalid request URL");
  }

  const normalizedOrigin = normalizeOrigin(origin);
  const normalizedRequestOrigin = normalizeOrigin(requestOrigin);
  const allowedOrigin = process.env.AUTH_URL
    ? normalizeOrigin(process.env.AUTH_URL)
    : null;

  if (
    normalizedOrigin !== normalizedRequestOrigin &&
    normalizedOrigin !== allowedOrigin
  ) {
    throw new AppError(
      403,
      "FORBIDDEN_ORIGIN",
      `Cross-site request blocked. Origin ${origin} is not allowed.`,
    );
  }
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) return "unknown";
  const first = forwardedFor.split(",")[0]?.trim();
  return first || "unknown";
}
