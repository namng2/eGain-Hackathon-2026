export type Identity = {
  name: string;
  /** Empty when the person identifies with a phone number instead. */
  email: string;
  /** Empty when the person identifies with an email instead. */
  phone: string;
};

export type EventStatus = "open" | "closed";

/** A suggested gift made from the event's interests poll. */
export type GiftIdea = {
  id: string;
  title: string;
  emoji: string;
  /** Display price, e.g. "$18" */
  priceLabel: string;
  priceUsd: number;
  /** Text used for the Amazon search link */
  searchQuery: string;
  /** Poll interests that led to this suggestion (empty for budget fallbacks) */
  matchedInterests: string[];
};

export type InterestCount = { interest: string; count: number };

export type GiftEvent = {
  id: string;
  name: string;
  companyName: string;
  /** ISO date-time string */
  date: string;
  /** A room name or a video-call link */
  location: string;
  budget: number;
  stealLimit: number;
  rules?: string;
  organizer: Identity;
  status: EventStatus;
  createdAt: string;
  /** Generated when sign-ups are closed. */
  giftIdeas?: GiftIdea[];
  /** ISO time the gift ideas were generated. */
  giftIdeasAt?: string;
};

export type Attendance = "in_person" | "remote";

export type Participant = {
  id: string;
  eventId: string;
  name: string;
  /** Empty when the person joined with a phone number. */
  email: string;
  phone?: string;
  department?: string;
  attendance: Attendance;
  /** The gift this person is bringing. Never shown to other players. */
  gift?: string;
  /** Normalized interests and hobbies. Empty when none were given. */
  interests: string[];
  joinedAt: string;
};

/** What anyone with the share link may see about the interests poll. No emails. */
export type PollData = {
  people: { name: string; interests: string[] }[];
  tally: InterestCount[];
  giftIdeas: GiftIdea[];
  giftIdeasAt?: string;
};

/** Event fields that are safe to show to anyone holding the share link. */
export type PublicEvent = Omit<GiftEvent, "organizer"> & {
  organizerName: string;
  participantCount: number;
};

export type Participation = {
  participant: Participant;
  event: PublicEvent;
};

export type AccountSummary = {
  organizing: PublicEvent[];
  joined: Participation[];
};

// ---------- Game play ----------

export type GamePhase = "playing" | "final" | "finished";

export type GameGift = {
  id: string;
  /** Participant ID of the person who brought the gift */
  contributorId: string;
  /** What the gift is. Hide it from players until it's opened (see toPlayerView). */
  name?: string;
  opened: boolean;
  /** Participant ID of whoever holds the gift now, or null while it's wrapped */
  holderId: string | null;
  stealCount: number;
};

export type GameMove =
  | { type: "open"; playerId: string; giftId: string }
  | { type: "steal"; playerId: string; giftId: string }
  | { type: "pass"; playerId: string };

export type GameState = {
  eventId: string;
  stealLimit: number;
  /** Participant IDs in the shuffled order they take regular turns */
  turnOrder: string[];
  /** Index into turnOrder of the regular turn in progress */
  turnIndex: number;
  /** Who acts next, or null once the game is finished */
  currentPlayerId: string | null;
  phase: GamePhase;
  gifts: GameGift[];
  /** The gift just taken from this player, which they can't take straight back */
  blocked: { playerId: string; giftId: string } | null;
  /** The player who gets the last steal once every gift is open */
  finalPlayerId: string;
  history: GameMove[];
};

export type AvailableMoves = {
  playerId: string | null;
  openable: string[];
  stealable: string[];
  canPass: boolean;
};
