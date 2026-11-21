/**
 * Asks Claude to write gift ideas from what the group picked.
 *
 * SERVER ONLY: this reads the API key from the environment. Import it only
 * from route handlers and server code, never from a client component.
 *
 * What is sent to Claude: the interest names with counts, the budget, and the
 * titles of earlier ideas to avoid. Never names, emails, or the event name.
 *
 * Every failure (no key, network, timeout, refusal, bad output) returns null,
 * and callers fall back to the built-in algorithm in gift-suggestions.ts.
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { INTERESTS, isInterest } from "./gift-catalog";
import type { GiftIdea, InterestCount } from "./types";

export const MAX_IDEAS = 6;
export const MIN_IDEAS = 3;

const DEFAULT_MODEL = "claude-opus-5-5";
// Models that accept the server-side refusal fallback (see the Claude API docs).
const FALLBACK_MODELS = new Set([
  "claude-opus-5-5",
  "claude-opus-5",
  "claude-sonnet-5-5",
  "claude-fable-5-2",
  "claude-fable-5-1",
]);

/** What we ask Claude to return. Checked again by sanitizeAiIdeas before use. */
const aiIdeasSchema = z.object({
  ideas: z.array(
    z.object({
      title: z.string(),
      emoji: z.string(),
      priceUsd: z.number(),
      why: z.string(),
      searchQuery: z.string(),
      interests: z.array(z.enum(INTERESTS)),
    }),
  ),
});

// Characters that could break layout or smuggle formatting: control characters.
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;

function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim().slice(0, max).trim();
}

function firstEmoji(value: unknown): string {
  if (typeof value !== "string") return "🎁";
  const first = [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(value.trim())][0]?.segment;
  return first && /\p{Extended_Pictographic}/u.test(first) ? first : "🎁";
}

function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Treats the model's answer as untrusted. Keeps only well-formed ideas that fit
 * the budget, tidies the text, and returns null if too few are left to use.
 */
export function sanitizeAiIdeas(raw: unknown, budget: number): GiftIdea[] | null {
  const list = (raw as { ideas?: unknown } | null)?.ideas;
  if (!Array.isArray(list)) return null;

  const seen = new Set<string>();
  const ideas: GiftIdea[] = [];
  for (const item of list) {
    if (ideas.length >= MAX_IDEAS) break;
    if (typeof item !== "object" || item === null) continue;
    const entry = item as Record<string, unknown>;

    const title = cleanText(entry.title, 80);
    const price = typeof entry.priceUsd === "number" ? Math.round(entry.priceUsd) : NaN;
    if (!title || !Number.isFinite(price) || price <= 0 || price > budget) continue;

    const id = slug(title);
    if (!id || seen.has(id)) continue;
    seen.add(id);

    const matched = Array.isArray(entry.interests)
      ? [...new Set(entry.interests.filter((v): v is string => typeof v === "string" && isInterest(v)))].slice(0, 4)
      : [];

    ideas.push({
      id,
      title,
      emoji: firstEmoji(entry.emoji),
      priceLabel: `$${price}`,
      priceUsd: price,
      searchQuery: cleanText(entry.searchQuery, 100) || title,
      matchedInterests: matched,
      why: cleanText(entry.why, 160) || undefined,
    });
  }
  return ideas.length >= MIN_IDEAS ? ideas : null;
}

/** The instructions and the data for Claude. Contains no personal details. */
export function buildGiftPrompt(
  tally: InterestCount[],
  budget: number,
  avoidTitles: string[] = [],
): { system: string; user: string } {
  const system = [
    "You suggest gifts for an office white elephant gift exchange.",
    "Pick gifts that are work-appropriate, fun, and easy to buy online.",
    "Never go over the budget. Prices are your best estimate in US dollars.",
    "Avoid alcohol, personal-care, clothing sizes, and anything that needs a health or safety warning.",
    "For each gift, write one friendly sentence on why it suits this group, mentioning the interests it serves.",
    "Reply only with the requested JSON.",
  ].join(" ");

  const lines = tally
    .filter(({ interest }) => isInterest(interest))
    .map(({ interest, count }) => `- ${interest}: ${count} ${count === 1 ? "person" : "people"}`);
  const avoid = avoidTitles
    .map((title) => cleanText(title, 80))
    .filter(Boolean)
    .slice(0, 12);

  const user = [
    `Budget per gift: $${Math.round(budget)} (do not exceed it).`,
    lines.length > 0
      ? `What the group picked as interests:\n${lines.join("\n")}`
      : "Nobody picked interests, so suggest crowd-pleasers most people would enjoy.",
    `Suggest ${MAX_IDEAS} different gifts. Cover the most popular interests first and mix in a couple of crowd-pleasers.`,
    avoid.length > 0 ? `Do not repeat these earlier suggestions:\n${avoid.map((t) => `- ${t}`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return { system, user };
}

let sharedClient: Anthropic | undefined;
function getClient(): Anthropic {
  // Reads ANTHROPIC_API_KEY (or ANTHROPIC_BASE_URL for tests) from the environment.
  sharedClient ??= new Anthropic({ timeout: 20_000, maxRetries: 1 });
  return sharedClient;
}

export type GiftAiInput = {
  tally: InterestCount[];
  budget: number;
  avoidTitles?: string[];
};

/**
 * Returns up to 6 AI-written ideas, or null when the AI can't help (the caller
 * then uses the algorithm). `deps.client` lets tests pass in a fake.
 */
export async function generateAiGiftIdeas(
  input: GiftAiInput,
  deps: { client?: Pick<Anthropic, "beta"> } = {},
): Promise<GiftIdea[] | null> {
  try {
    const client = deps.client ?? getClient();
    const model = process.env.GIFT_AI_MODEL || DEFAULT_MODEL;
    const { system, user } = buildGiftPrompt(input.tally, input.budget, input.avoidTitles);

    const response = await client.beta.messages.parse({
      model,
      max_tokens: 4000,
      // If a safety classifier declines, the API retries on a fallback model for us.
      ...(FALLBACK_MODELS.has(model)
        ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
        : {}),
      system,
      messages: [{ role: "user", content: user }],
      output_config: { format: betaZodOutputFormat(aiIdeasSchema), effort: "low" },
    });

    if (response.stop_reason === "refusal") {
      console.warn("[ai-gifts] the model declined; using the algorithm instead");
      return null;
    }
    const ideas = sanitizeAiIdeas(response.parsed_output, input.budget);
    if (!ideas) console.warn("[ai-gifts] answer had too few usable ideas; using the algorithm instead");
    return ideas;
  } catch (err) {
    // Message only: never log request details or credentials.
    console.warn("[ai-gifts] AI unavailable, using the algorithm instead:", err instanceof Error ? err.message : "unknown error");
    return null;
  }
}
