import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getPoll } from "@/lib/poll";

type Context = { params: Promise<{ eventId: string }> };

/** Public: everyone's names and interests, the top interests, and gift ideas. No emails. */
export async function GET(_request: Request, { params }: Context) {
  const { eventId } = await params;
  const poll = await getPoll(eventId);
  if (!poll) return apiError("Event not found", 404);
  return NextResponse.json(poll);
}
