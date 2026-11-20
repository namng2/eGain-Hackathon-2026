import { NextResponse } from "next/server";
import type { z } from "zod";
import { firstIssue } from "./validation";

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Parses and validates a JSON body. Returns a ready-made 400 response on failure. */
export async function parseBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<
  | { ok: true; data: z.output<S> }
  | { ok: false; response: NextResponse }
> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { ok: false, response: apiError("Request body must be JSON", 400) };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    return { ok: false, response: apiError(firstIssue(result.error), 400) };
  }
  return { ok: true, data: result.data as z.output<S> };
}
