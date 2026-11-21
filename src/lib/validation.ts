import { z } from "zod";
import { INTERESTS } from "./gift-catalog";
import {
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  normalizeName,
  normalizePhone,
} from "./identity-match";

const name = z
  .string()
  .transform(normalizeName)
  .pipe(z.string().min(1, "Name is required").max(80, "Name is too long"));

// Email and phone are both optional on the wire; the contact rule below
// requires at least one of them to be valid.
const email = z
  .string()
  .max(200)
  .optional()
  .transform((v) => normalizeEmail(v ?? ""));

const phone = z
  .string()
  .max(40)
  .optional()
  .transform((v) => normalizePhone(v ?? ""));

type Contact = { email: string; phone: string };

function checkContact(value: Contact, ctx: z.RefinementCtx) {
  if (!value.email && !value.phone) {
    ctx.addIssue({
      code: "custom",
      message: "Enter an email address or phone number",
      path: ["email"],
    });
  } else if (value.email && !isValidEmail(value.email)) {
    ctx.addIssue({
      code: "custom",
      message: "Enter a valid email address",
      path: ["email"],
    });
  } else if (value.phone && !isValidPhone(value.phone)) {
    ctx.addIssue({
      code: "custom",
      message: "Enter a valid phone number",
      path: ["phone"],
    });
  }
}

export const identitySchema = z
  .object({ name, email, phone })
  .superRefine(checkContact);

/** The organizer must have an email, since the manage page is tied to it. */
const organizerSchema = identitySchema.refine((v) => v.email !== "", {
  message: "The organizer needs an email address",
  path: ["email"],
});

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
  rules: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
};

export const createEventSchema = z.object({
  organizer: organizerSchema,
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

const gift = z
  .string({ error: "Tell us what gift you're bringing" })
  .trim()
  .min(1, "Tell us what gift you're bringing")
  .max(120, "Keep the gift under 120 characters");

const participantFields = {
  department: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v ? v : undefined)),
  attendance: z.enum(["in_person", "remote"], {
    error: "Choose in person or remote",
  }),
  gift: gift.optional(),
  interests: interests.optional(),
};

export const joinEventSchema = z
  .object({
    name,
    email,
    phone,
    ...participantFields,
    gift,
    // A new sign-up with no interests stores an empty list.
    interests: interests.optional().transform((items) => items ?? []),
  })
  .superRefine(checkContact);

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
