import { AppError } from "@/lib/app-error";

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

  if (origin !== requestOrigin) {
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
