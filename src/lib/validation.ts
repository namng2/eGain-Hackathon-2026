import { z } from "zod";
import { normalizeInterest } from "./gift-suggestions";
import { normalizeEmail, normalizeName } from "./identity-match";

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
const MAX_INTEREST_LENGTH = 30;

// Each entry is normalized, cut to 30 characters, and empty or repeated
// entries are dropped. More than 8 left after that is an error.
const interests = z
  .array(z.string())
  .transform((items) => [
    ...new Set(
      items
        .map((item) => normalizeInterest(item).slice(0, MAX_INTEREST_LENGTH).trim())
        .filter(Boolean),
    ),
  ])
  .refine((items) => items.length <= MAX_INTERESTS, {
    message: `List up to ${MAX_INTERESTS} interests`,
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

/** Returns the first validation message, for showing next to a form. */
export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue?.message ?? "Invalid request";
}
