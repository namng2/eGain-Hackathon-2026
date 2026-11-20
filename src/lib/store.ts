/**
 * The only module that touches storage.
 *
 * For this first draft everything lives in one JSON file on the server
 * (data/store.json). To move to a real database later, rewrite the functions
 * in this file and keep their signatures; pages and API routes don't change.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { customAlphabet, nanoid } from "nanoid";
import {
  contactKey,
  normalizeEmail,
  normalizePhone,
} from "./identity-match";
import type { GiftEvent, Participant } from "./types";

type StoreData = {
  events: GiftEvent[];
  participants: Participant[];
};

const DATA_FILE =
  process.env.WHITE_ELEPHANT_DATA_FILE ??
  path.join(process.cwd(), "data", "store.json");

// Short, unambiguous IDs for share links, e.g. /join/k3x9p2qa
const newEventId = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 8);

export class StoreConflictError extends Error {}

async function readData(): Promise<StoreData> {
  try {
    // The data file is runtime state, not source. Tell the bundler not to trace it.
    const raw = await fs.readFile(/* turbopackIgnore: true */ DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      events: parsed.events ?? [],
      participants: parsed.participants ?? [],
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { events: [], participants: [] };
    }
    throw err;
  }
}

async function writeData(data: StoreData): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  await fs.rename(tmp, DATA_FILE);
}

// Writes run one at a time so two sign-ups arriving together can't overwrite
// each other. The queue lives on globalThis so every route shares it.
const globalForStore = globalThis as typeof globalThis & {
  __whiteElephantWriteQueue?: Promise<unknown>;
};

function mutate<T>(change: (data: StoreData) => T): Promise<T> {
  const previous = globalForStore.__whiteElephantWriteQueue ?? Promise.resolve();
  const run = previous.then(async () => {
    const data = await readData();
    const result = change(data);
    await writeData(data);
    return result;
  });
  globalForStore.__whiteElephantWriteQueue = run.catch(() => undefined);
  return run;
}

// ---------- Events ----------

export type NewEvent = Omit<GiftEvent, "id" | "status" | "createdAt">;
export type EventChanges = Partial<
  Omit<GiftEvent, "id" | "organizer" | "createdAt">
>;

export function createEvent(input: NewEvent): Promise<GiftEvent> {
  return mutate((data) => {
    let id = newEventId();
    while (data.events.some((e) => e.id === id)) id = newEventId();
    const event: GiftEvent = {
      ...input,
      organizer: {
        name: input.organizer.name,
        email: normalizeEmail(input.organizer.email),
        phone: "",
      },
      id,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    data.events.push(event);
    return event;
  });
}

export async function getEvent(id: string): Promise<GiftEvent | undefined> {
  const data = await readData();
  return data.events.find((e) => e.id === id);
}

export function updateEvent(
  id: string,
  changes: EventChanges,
): Promise<GiftEvent | undefined> {
  return mutate((data) => {
    const event = data.events.find((e) => e.id === id);
    if (!event) return undefined;
    Object.assign(event, changes);
    return event;
  });
}

export async function listEventsByOrganizer(
  email: string,
): Promise<GiftEvent[]> {
  const data = await readData();
  const target = normalizeEmail(email);
  return data.events
    .filter((e) => e.organizer.email === target)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ---------- Participants ----------

export type ParticipantInput = Omit<Participant, "id" | "eventId" | "joinedAt">;
export type ParticipantChanges = Partial<
  Pick<
    Participant,
    "department" | "attendance" | "giftTeaser" | "interests" | "phone"
  >
>;

/**
 * Adds someone to an event. If the same name + email (or name + phone) already
 * signed up, their entry is updated instead of duplicated. If that contact is
 * taken under a different name, a StoreConflictError is thrown.
 */
export function upsertParticipant(
  eventId: string,
  input: ParticipantInput,
): Promise<{ participant: Participant; created: boolean }> {
  return mutate((data) => {
    const email = normalizeEmail(input.email);
    const phone = normalizePhone(input.phone ?? "");
    const key = contactKey({ email, phone });
    const existing = data.participants.find(
      (p) => p.eventId === eventId && contactKey(p) === key,
    );
    if (existing) {
      if (existing.name.toLowerCase() !== input.name.toLowerCase()) {
        throw new StoreConflictError(
          "That email or phone is already signed up under a different name. Use the same name, or manage the entry from the account page.",
        );
      }
      Object.assign(existing, {
        name: input.name,
        phone: phone || undefined,
        department: input.department,
        attendance: input.attendance,
        interests: input.interests,
        giftTeaser: input.giftTeaser,
      });
      return { participant: existing, created: false };
    }
    const participant: Participant = {
      ...input,
      email,
      phone: phone || undefined,
      id: nanoid(12),
      eventId,
      joinedAt: new Date().toISOString(),
    };
    data.participants.push(participant);
    return { participant, created: true };
  });
}

export async function getParticipant(
  id: string,
): Promise<Participant | undefined> {
  const data = await readData();
  return data.participants.find((p) => p.id === id);
}

export async function listParticipants(eventId: string): Promise<Participant[]> {
  const data = await readData();
  return data.participants
    .filter((p) => p.eventId === eventId)
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
}

export async function countParticipants(eventId: string): Promise<number> {
  const data = await readData();
  return data.participants.filter((p) => p.eventId === eventId).length;
}

export async function listParticipationsByContact(contact: {
  email: string;
  phone: string;
}): Promise<{ participant: Participant; event: GiftEvent }[]> {
  const data = await readData();
  const target = contactKey(contact);
  return data.participants
    .filter((p) => contactKey(p) === target)
    .flatMap((participant) => {
      const event = data.events.find((e) => e.id === participant.eventId);
      return event ? [{ participant, event }] : [];
    })
    .sort((a, b) => a.event.date.localeCompare(b.event.date));
}

export function updateParticipant(
  id: string,
  changes: ParticipantChanges,
): Promise<Participant | undefined> {
  return mutate((data) => {
    const participant = data.participants.find((p) => p.id === id);
    if (!participant) return undefined;
    Object.assign(participant, changes);
    return participant;
  });
}

export function removeParticipant(id: string): Promise<boolean> {
  return mutate((data) => {
    const before = data.participants.length;
    data.participants = data.participants.filter((p) => p.id !== id);
    return data.participants.length < before;
  });
}
