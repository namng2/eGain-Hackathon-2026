import { avatarUrl } from "./avatar";
import { summarizeReactions } from "./reactions";
import type {
  ChatMember,
  ChatMessage,
  GiftEvent,
  Participant,
  PublicChatMessage,
} from "./types";

/** Longest chat message text. Shared by the server check and the browser's textarea. */
export const MAX_CHAT_TEXT = 1000;

/** URL a client uses to show a message's image. */
export function chatImageUrl(eventId: string, imageId: string): string {
  return `/api/events/${eventId}/chat/images/${imageId}`;
}

const emailKey = (email: string) => email.trim().toLowerCase();

/** Avatar URLs by (lowercased) email, for the people in an event who have a picture. */
export function buildAvatarMap(
  eventId: string,
  participants: Pick<Participant, "email" | "avatar">[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of participants) {
    if (p.avatar) map.set(emailKey(p.email), avatarUrl(eventId, p.avatar.id));
  }
  return map;
}

/**
 * Builds what people in the chat may see. Built from a whitelist, never by
 * spreading the stored message, so authorEmail and future fields can't leak.
 * Avatars are looked up by author email now, so a new picture also shows on
 * older messages.
 */
export function toPublicMessage(
  message: ChatMessage,
  context: { viewerEmail: string; avatars: ReadonlyMap<string, string> },
): PublicChatMessage {
  return {
    id: message.id,
    authorName: message.authorName,
    text: message.text,
    imageUrl: message.image
      ? chatImageUrl(message.eventId, message.image.id)
      : undefined,
    authorAvatarUrl: context.avatars.get(emailKey(message.authorEmail)),
    reactions: summarizeReactions(message.reactions, context.viewerEmail),
    createdAt: message.createdAt,
  };
}

/** The "who's here" row: the organizer first, then everyone signed up. No emails. */
export function toChatMembers(
  organizer: GiftEvent["organizer"],
  participants: Pick<Participant, "name" | "email">[],
  avatars: ReadonlyMap<string, string>,
): ChatMember[] {
  const organizerKey = emailKey(organizer.email);
  return [
    {
      name: organizer.name,
      avatarUrl: avatars.get(organizerKey),
      isOrganizer: true,
    },
    ...participants
      .filter((p) => emailKey(p.email) !== organizerKey)
      .map((p) => ({
        name: p.name,
        avatarUrl: avatars.get(emailKey(p.email)),
        isOrganizer: false,
      })),
  ];
}
