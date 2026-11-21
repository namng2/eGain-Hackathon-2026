import type { Identity } from "./types";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Keeps digits and a leading "+". Spaces, dashes, dots, and brackets are dropped. */
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/\D/g, "");
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?\d{7,15}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email) && email.length <= 200;
}

export function isValidPhone(phone: string): boolean {
  return PHONE_PATTERN.test(normalizePhone(phone));
}

/**
 * Splits one "email or phone" box into the two stored fields. Anything with
 * an "@" is treated as an email; everything else as a phone number.
 */
export function parseContact(raw: string): { email: string; phone: string } {
  const value = raw.trim();
  if (value.includes("@")) return { email: normalizeEmail(value), phone: "" };
  return { email: "", phone: normalizePhone(value) };
}

/** The key that identifies a person without a login: their email, or else their phone. */
export function contactKey(contact: { email?: string; phone?: string }): string {
  const email = normalizeEmail(contact.email ?? "");
  if (email) return `email:${email}`;
  return `phone:${normalizePhone(contact.phone ?? "")}`;
}

/**
 * Without a login, "who you are" is your name + email or phone. Two identities
 * match when the names are equal (ignoring case and extra whitespace) and the
 * contact keys are equal.
 */
type Matchable = Pick<Identity, "name"> & { email?: string; phone?: string };

export function identitiesMatch(a: Matchable, b: Matchable): boolean {
  return (
    normalizeName(a.name).toLowerCase() === normalizeName(b.name).toLowerCase() &&
    contactKey(a) === contactKey(b)
  );
}
