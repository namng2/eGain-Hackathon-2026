import type { ChatMessage, PublicChatMessage } from "./types";

/** Longest chat message text. Shared by the server check and the browser's textarea. */
export const MAX_CHAT_TEXT = 1000;

/** URL a client uses to show a message's image. */
export function chatImageUrl(eventId: string, imageId: string): string {
  return `/api/events/${eventId}/chat/images/${imageId}`;
}

/**
 * Builds what people in the chat may see. Built from a whitelist, never by
 * spreading the stored message, so authorEmail and future fields can't leak.
 */
export function toPublicMessage(message: ChatMessage): PublicChatMessage {
  return {
    id: message.id,
    authorName: message.authorName,
    text: message.text,
    imageUrl: message.image
      ? chatImageUrl(message.eventId, message.image.id)
      : undefined,
    createdAt: message.createdAt,
  };
}
