export type Identity = {
  name: string;
  /** Empty when the person identifies with a phone number instead. */
  email: string;
  /** Empty when the person identifies with an email instead. */
  phone: string;
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
  /** Empty when the person joined with a phone number. */
  email: string;
  phone?: string;
  department?: string;
  attendance: Attendance;
  /** What the person likes. The gift is written from this. Older entries may lack it. */
  interests?: string;
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
