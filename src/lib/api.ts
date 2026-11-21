import { NextResponse } from "next/server";
import type { z } from "zod";
import { firstIssue, identityOnlySchema, sendMessageSchema } from "./validation";

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

const formText = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value : undefined;

/**
 * Parses a chat message sent as multipart form data (name, email, text, and an
 * optional image file). The text fields are validated with sendMessageSchema;
 * the image is returned as-is for the route to check.
 */
export async function parseMessageForm(request: Request): Promise<
  | {
      ok: true;
      data: z.output<typeof sendMessageSchema>;
      image: File | null;
    }
  | { ok: false; response: NextResponse }
> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return { ok: false, response: apiError("Request must be a form", 400) };
  }
  const result = sendMessageSchema.safeParse({
    identity: {
      name: formText(form.get("name")) ?? "",
      email: formText(form.get("email")) ?? "",
    },
    text: formText(form.get("text")),
  });
  if (!result.success) {
    return { ok: false, response: apiError(firstIssue(result.error), 400) };
  }
  const image = form.get("image");
  return {
    ok: true,
    data: result.data,
    image: image instanceof File && image.size > 0 ? image : null,
  };
}

/** Parses a profile picture upload: multipart form with name, email, and an image file. */
export async function parseAvatarForm(request: Request): Promise<
  | { ok: true; identity: z.output<typeof identityOnlySchema>["identity"]; image: File | null }
  | { ok: false; response: NextResponse }
> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return { ok: false, response: apiError("Request must be a form", 400) };
  }
  const result = identityOnlySchema.safeParse({
    identity: {
      name: formText(form.get("name")) ?? "",
      email: formText(form.get("email")) ?? "",
    },
  });
  if (!result.success) {
    return { ok: false, response: apiError(firstIssue(result.error), 400) };
  }
  const image = form.get("image");
  return {
    ok: true,
    identity: result.data.identity,
    image: image instanceof File && image.size > 0 ? image : null,
  };
}
