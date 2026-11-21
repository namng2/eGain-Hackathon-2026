import { z } from "zod";
import { INTERESTS } from "./gift-catalog";
import { normalizeEmail, normalizeName } from "./identity-match";
import { MAX_CHAT_TEXT } from "./public-chat";
import { REACTION_EMOJIS } from "./reactions";

const name = z
  .string()
  .transform(normalizeName)
  .pipe(z.string().min(1, "Name is required").max(80, "Name is too long"));

const email = z
  .string()
  .transform(normalizeEmail)
  .pipe(z.email("Enter a valid email address").max(200));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const identitySchema = z.object({ name, email });

const eventFields = {
  name: z.string().trim().min(1, "Event name is required").max(120),
  companyName: z.string().trim().min(1, "Company name is required").max(120),
  // Wall-clock value from <input type="datetime-local">, e.g. 2026-12-18T12:00.
  // It is stored as typed (no timezone) so it shows the same time everywhere.
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/, "Enter a valid date and time"),
  location: z.string().trim().min(1, "Location is required").max(300),
  budget: z.coerce
    .number({ error: "Budget must be a number" })
    .min(1, "Budget must be at least 1")
    .max(10000),
  stealLimit: z.coerce.number().int().min(1).max(10),
  rules: optionalText(2000),
};

export const createEventSchema = z.object({
  organizer: identitySchema,
  ...eventFields,
});

export const updateEventSchema = z.object({
  identity: identitySchema,
  changes: z
    .object({
      ...eventFields,
      status: z.enum(["open", "closed"]),
    })
    .partial(),
});

const MAX_INTERESTS = 8;

// Interests must come from the fixed list. Repeats are dropped, and more than
// 8 left after that is an error.
const interests = z
  .array(z.enum(INTERESTS, { error: "Choose interests from the list" }))
  .transform((items) => [...new Set(items)])
  .refine((items) => items.length <= MAX_INTERESTS, {
    message: `Pick up to ${MAX_INTERESTS} interests`,
  });

const participantFields = {
  department: optionalText(80),
  attendance: z.enum(["in_person", "remote"], {
    error: "Choose in person or remote",
  }),
  giftTeaser: optionalText(200),
  interests: interests.optional(),
};

export const joinEventSchema = z.object({
  name,
  email,
  ...participantFields,
  // A new sign-up with no interests stores an empty list.
  interests: interests.optional().transform((items) => items ?? []),
});

export const updateParticipantSchema = z.object({
  identity: identitySchema,
  changes: z.object(participantFields).partial(),
});

export const identityOnlySchema = z.object({ identity: identitySchema });

export const reactionSchema = z.object({
  identity: identitySchema,
  emoji: z.enum(REACTION_EMOJIS, { error: "Choose one of the available reactions" }),
});

// A message needs text or an image. The route checks the image side.
export const sendMessageSchema = z.object({
  identity: identitySchema,
  text: z
    .string()
    .trim()
    .max(MAX_CHAT_TEXT, `Messages can be up to ${MAX_CHAT_TEXT} characters`)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

/** Returns the first validation message, for showing next to a form. */
export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue?.message ?? "Invalid request";
}
