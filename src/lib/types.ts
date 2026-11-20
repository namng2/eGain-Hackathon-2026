export type Identity = {
  name: string;
  email: string;
};

export type EventStatus = "open" | "closed";

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
};

export type Attendance = "in_person" | "remote";

export type Participant = {
  id: string;
  eventId: string;
  name: string;
  email: string;
  department?: string;
  attendance: Attendance;
  giftTeaser?: string;
  joinedAt: string;
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
