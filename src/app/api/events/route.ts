import { NextResponse } from "next/server";
import { parseBody } from "@/lib/api";
import { createEvent } from "@/lib/store";
import { createEventSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = await parseBody(request, createEventSchema);
  if (!parsed.ok) return parsed.response;

  const { organizer, ...fields } = parsed.data;
  const event = await createEvent({ ...fields, organizer });
  return NextResponse.json({ id: event.id }, { status: 201 });
}
