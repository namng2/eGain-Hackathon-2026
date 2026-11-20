export type Identity = {
  name: string;
  email: string;
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
  email: string;
  department?: string;
  attendance: Attendance;
  giftTeaser?: string;
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
