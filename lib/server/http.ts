import { isDatabaseConfigured } from "../../db";
import { ApiError } from "./test-service";

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) },
    ...init,
  });
}

export function requireDatabase() {
  if (!isDatabaseConfigured()) throw new ApiError(503, "DATABASE_UNCONFIGURED", "Supabase is not connected yet. Add the server environment variables in Vercel.");
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) return json({ error: error.message, code: error.code, details: error.details }, { status: error.status });
  console.error(error);
  return json({ error: "Unexpected server error", code: "INTERNAL_ERROR" }, { status: 500 });
}
