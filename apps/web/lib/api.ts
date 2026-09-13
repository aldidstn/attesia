import { NextResponse } from "next/server";

export type ApiErrorCode = "BAD_REQUEST" | "UNAUTHORIZED" | "CONFLICT" | "NOT_FOUND" | "CONFIG_REQUIRED" | "UPSTREAM_UNAVAILABLE";
const statuses: Record<ApiErrorCode, number> = { BAD_REQUEST: 400, UNAUTHORIZED: 401, CONFLICT: 409, NOT_FOUND: 404, CONFIG_REQUIRED: 503, UPSTREAM_UNAVAILABLE: 503 };
export function correlationId(request?: Request) { return request?.headers.get("x-correlation-id") ?? crypto.randomUUID(); }
export function json(data: unknown, options: { status?: number; etag?: string; correlation?: string; retryAfter?: number } = {}) {
  const headers = new Headers({ "x-correlation-id": options.correlation ?? crypto.randomUUID() });
  if (options.etag) headers.set("etag", options.etag);
  if (options.retryAfter) headers.set("retry-after", String(options.retryAfter));
  return NextResponse.json(data, { status: options.status ?? 200, headers });
}
export function apiError(code: ApiErrorCode, message: string, request?: Request, details?: unknown) {
  const correlation = correlationId(request);
  return json({ error: { code, message, details, correlationId: correlation } }, { status: statuses[code], correlation, retryAfter: code === "UPSTREAM_UNAVAILABLE" || code === "CONFIG_REQUIRED" ? 30 : undefined });
}

export function encodeCursor(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

export function decodeCursor(value: string | null): string {
  if (!value) return "";
  try { return Buffer.from(value, "base64url").toString("utf8"); }
  catch { throw new Error("Invalid pagination cursor"); }
}
