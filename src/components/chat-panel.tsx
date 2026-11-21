"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { callApi, callApiForm } from "@/lib/client-api";
import { MAX_IMAGE_BYTES } from "@/lib/chat-image";
import { errorText } from "@/lib/errors";
import { formatBudget, formatDateTime, formatEventDate } from "@/lib/format";
import { MAX_CHAT_TEXT } from "@/lib/public-chat";
import { REACTION_EMOJIS } from "@/lib/reactions";
import type {
  ChatMember,
  ChatRole,
  Identity,
  PublicChatMessage,
  PublicEvent,
} from "@/lib/types";
import { Avatar } from "./avatar";
import { IdentityGate } from "./identity-gate";
import { Alert, Button, Card, EmptyNote, StatusBadge, inputClass } from "./ui";

type ChatData = {
  messages: PublicChatMessage[];
  members: ChatMember[];
  me: { name: string; role: ChatRole };
};

const POLL_MS = 3000;

/** The group chat page body: asks for name + email, then shows the chat. */
export function ChatView({ eventId }: { eventId: string }) {
  return (
    <IdentityGate
      title="Join the chat"
      description="Enter the name and email you signed up with (or created the event with). There's no password yet."
    >
      {(identity, forget) => (
        <ChatPanel eventId={eventId} identity={identity} onForget={forget} />
      )}
    </IdentityGate>
  );
}

function ChatPanel({
  eventId,
  identity,
  onForget,
}: {
  eventId: string;
  identity: Identity;
  onForget: () => void;
}) {
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [data, setData] = useState<ChatData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  // Only jump to new messages if the reader was already at the bottom.
  const stickToBottom = useRef(true);

  useEffect(() => {
    let active = true;
    callApi<PublicEvent>(`/api/events/${eventId}`, { method: "GET" }).then(
      (found) => {
        if (active) setEvent(found);
      },
      () => {
        // The banner is a nicety. The chat itself reports any real problem.
      },
    );
    return () => {
      active = false;
    };
  }, [eventId]);

  // Ask for the latest messages now, then every few seconds while the tab is visible.
  useEffect(() => {
    let active = true;
    const load = () =>
      callApi<ChatData>(`/api/events/${eventId}/chat`, {
        body: { identity },
      }).then(
        (next) => {
          if (!active) return;
          setData(next);
          setLoadError(null);
        },
        (err: unknown) => {
          if (active) setLoadError(errorText(err));
        },
      );
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [eventId, identity, version]);

  const messageCount = data?.messages.length ?? 0;
  useEffect(() => {
    const list = listRef.current;
    if (list && stickToBottom.current) list.scrollTop = list.scrollHeight;
  }, [messageCount]);

  // Free the preview's memory when the panel goes away.
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function setPicked(file: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = file ? URL.createObjectURL(file) : null;
    setImage(file);
    setPreview(previewRef.current);
  }

  function handlePick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = ""; // so picking the same file again still fires
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSendError("Choose an image file (JPEG, PNG, GIF, or WebP).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setSendError("That image is too big. The limit is 5 MB.");
      return;
    }
    setSendError(null);
    setPicked(file);
  }

  async function send() {
    if (sending || (!text.trim() && !image)) return;
    const form = new FormData();
    form.set("name", identity.name);
    form.set("email", identity.email);
    form.set("phone", identity.phone ?? "");
    if (text.trim()) form.set("text", text);
    if (image) form.set("image", image);

    setSending(true);
    setSendError(null);
    try {
      await callApiForm(`/api/events/${eventId}/chat/messages`, form);
      setText("");
      setPicked(null);
      stickToBottom.current = true;
      refresh();
    } catch (err) {
      setSendError(errorText(err));
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void send();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  }

  async function remove(message: PublicChatMessage) {
    if (!window.confirm("Delete this message for everyone?")) return;
    try {
      await callApi(`/api/events/${eventId}/chat/messages/${message.id}`, {
        method: "DELETE",
        body: { identity },
      });
      refresh();
    } catch (err) {
      setSendError(errorText(err));
    }
  }

  async function react(message: PublicChatMessage, emoji: string) {
    try {
      await callApi(
        `/api/events/${eventId}/chat/messages/${message.id}/reactions`,
        { body: { identity, emoji } },
      );
      refresh();
    } catch (err) {
      setSendError(errorText(err));
    }
  }

  if (!data) {
    if (loadError) {
      return (
        <Alert tone="error">
          <p>{loadError}</p>
          <Button variant="secondary" onClick={onForget} className="mt-3">
            Use a different name and email
          </Button>
        </Alert>
      );
    }
    return <p className="text-sm text-stone-500">Loading chat…</p>;
  }

  const canModerate = data.me.role === "organizer";
  const myName = data.me.name.toLowerCase();

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {event ? (
              <p className="text-sm font-medium text-emerald-800">{event.companyName}</p>
            ) : null}
            <h1 className="text-2xl font-bold tracking-tight">
              {event ? `${event.name} chat` : "Group chat"}
            </h1>
          </div>
          {event ? <StatusBadge status={event.status} /> : null}
        </div>
        {event ? (
          <p className="mt-2 text-sm text-stone-600">
            {formatEventDate(event.date)} · {event.location} · Budget{" "}
            {formatBudget(event.budget)}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-stone-600">
          Signed in as <strong className="text-stone-900">{data.me.name}</strong>.{" "}
          <button
            type="button"
            onClick={onForget}
            className="font-medium text-emerald-800 underline underline-offset-2"
          >
            Not you?
          </button>
        </p>

        <div className="mt-4 border-t border-stone-200 pt-4">
          <h2 className="text-sm font-semibold text-stone-800">
            Who&apos;s here ({data.members.length})
          </h2>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-3">
            {data.members.map((member) => (
              <li key={`${member.name}-${member.isOrganizer}`} className="flex items-center gap-2">
                <Avatar name={member.name} url={member.avatarUrl} size="sm" />
                <span className="text-sm text-stone-800">
                  {member.name}
                  {member.isOrganizer ? (
                    <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      Organizer
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {loadError ? (
        <Alert tone="info">Having trouble reaching the chat. Trying again…</Alert>
      ) : null}

      <Card className="!p-0 overflow-hidden">
        <div
          ref={listRef}
          role="log"
          aria-label="Chat messages"
          onScroll={(e) => {
            const el = e.currentTarget;
            stickToBottom.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
          className="h-[55vh] min-h-64 space-y-4 overflow-y-auto bg-stone-50 p-4"
        >
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-inset ring-emerald-200">
            <p className="font-semibold">
              Welcome to the {event ? event.name : "event"} chat 🎁
            </p>
            <p className="mt-1">
              Say hi, share the kind of gift you&apos;re hoping to get, and plan your
              steals. Keep it friendly, and keep the surprise: don&apos;t give away
              what you&apos;re bringing!
            </p>
          </div>

          {data.messages.length === 0 ? (
            <EmptyNote>No messages yet. Be the first to say hello!</EmptyNote>
          ) : (
            data.messages.map((message) => {
              const mine = message.authorName.toLowerCase() === myName;
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  mine={mine}
                  canDelete={mine || canModerate}
                  onDelete={() => void remove(message)}
                  onReact={(emoji) => void react(message, emoji)}
                />
              );
            })
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 border-t border-stone-200 p-4">
          {preview ? (
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a file the user just picked */}
              <img
                src={preview}
                alt="Image to send"
                className="h-20 w-20 rounded-lg object-cover ring-1 ring-stone-200"
              />
              <Button variant="secondary" onClick={() => setPicked(null)}>
                Remove image
              </Button>
            </div>
          ) : null}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_CHAT_TEXT}
            rows={2}
            placeholder="Write a message…"
            aria-label="Message"
            className={`${inputClass} mt-0 resize-none`}
          />
          {sendError ? <Alert tone="error">{sendError}</Alert> : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handlePick}
                className="sr-only"
                tabIndex={-1}
                aria-label="Choose an image"
              />
              <Button
                variant="secondary"
                disabled={sending}
                onClick={() => fileRef.current?.click()}
              >
                Add image
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-stone-500 sm:inline">
                Enter to send, Shift+Enter for a new line
              </span>
              <Button type="submit" disabled={sending || (!text.trim() && !image)}>
                {sending ? "Sending…" : "Send"}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <p className="text-sm text-stone-500">
        <Link href="/account" className="font-medium text-emerald-800 underline">
          Back to my account
        </Link>
      </p>
    </div>
  );
}

function MessageBubble({
  message,
  mine,
  canDelete,
  onDelete,
  onReact,
}: {
  message: PublicChatMessage;
  mine: boolean;
  canDelete: boolean;
  onDelete: () => void;
  onReact: (emoji: string) => void;
}) {
  const [picking, setPicking] = useState(false);

  return (
    <div className={`flex items-start gap-2 ${mine ? "flex-row-reverse" : ""}`}>
      <Avatar name={message.authorName} url={message.authorAvatarUrl} size="sm" />
      <div className="max-w-[80%] sm:max-w-[70%]">
        <p
          className={`mb-0.5 text-xs text-stone-500 ${mine ? "text-right" : ""}`}
        >
          <span className="font-medium text-stone-700">
            {mine ? "You" : message.authorName}
          </span>{" "}
          · {formatDateTime(message.createdAt)}
        </p>
        <div
          className={`rounded-2xl px-3 py-2 text-sm ${
            mine
              ? "bg-emerald-700 text-white"
              : "bg-white text-stone-900 ring-1 ring-inset ring-stone-200"
          }`}
        >
          {message.text ? (
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          ) : null}
          {message.imageUrl ? (
            <a
              href={message.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={message.text ? "mt-2 block" : "block"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- private runtime file, not suited to the image optimizer */}
              <img
                src={message.imageUrl}
                alt={`Image sent by ${message.authorName}`}
                loading="lazy"
                className="max-h-64 max-w-full rounded-lg"
              />
            </a>
          ) : null}
        </div>

        <div
          className={`mt-1 flex flex-wrap items-center gap-1.5 ${
            mine ? "justify-end" : ""
          }`}
        >
          {message.reactions.map(({ emoji, count, mine: reacted }) => (
            <button
              key={emoji}
              type="button"
              aria-pressed={reacted}
              aria-label={`${emoji} ${count}${reacted ? ", you reacted" : ""}`}
              onClick={() => onReact(emoji)}
              className={`rounded-full px-2 py-0.5 text-xs ring-1 ring-inset transition-colors ${
                reacted
                  ? "bg-emerald-50 text-emerald-900 ring-emerald-400"
                  : "bg-white text-stone-700 ring-stone-300 hover:bg-stone-50"
              }`}
            >
              {emoji} {count}
            </button>
          ))}
          {picking ? (
            <span className="flex gap-1 rounded-full bg-white px-1.5 py-0.5 ring-1 ring-inset ring-stone-300">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={`React with ${emoji}`}
                  onClick={() => {
                    setPicking(false);
                    onReact(emoji);
                  }}
                  className="rounded px-1 text-base hover:bg-stone-100"
                >
                  {emoji}
                </button>
              ))}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="text-xs text-stone-500 underline underline-offset-2 hover:text-emerald-800"
            >
              React
            </button>
          )}
          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-stone-500 underline underline-offset-2 hover:text-red-700"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
