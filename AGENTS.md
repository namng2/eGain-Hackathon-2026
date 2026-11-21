# AGENTS.md — White Elephant

Guide for anyone (human or automated tool) working in this repo.

## What this is

A web app for running an office **white elephant gift exchange**.

1. An organizer creates an event and gets a **share link** (`/join/<eventId>`).
2. Colleagues open the link and **sign up** with a form.
3. Everyone **manages their own entry** on the account page.

Current scope is a **first draft**:

- **No login.** "Who you are" is just a name + email typed into the browser.
  Anyone who knows someone's name + email can act as them. Do not treat this
  as secure. Real auth is a planned follow-up.
- **No database.** Data lives in `data/store.json` on the server. It is
  gitignored and created on first write.
- **Interests poll and gift ideas** exist. See "Interests poll" under Conventions.
- **Game rules exist, but aren't connected yet.** `src/lib/game.ts` runs a
  game (turn order, opening, stealing, freezing, final steal), but nothing
  saves a game or exposes it through routes or pages yet.

## Game rules (`src/lib/game.ts`)

- Every player brings one gift. Turn order is shuffled at the start.
- On a turn, a player opens any wrapped gift, or steals an opened gift from
  someone else. The person stolen from acts next, out of turn order.
- A gift is frozen once it has been stolen `event.stealLimit` times.
- A player can't steal back the gift that was just taken from them on their
  very next action.
- Once every gift is open, one randomly chosen player (picked at the start)
  may swap their gift for any unfrozen gift, or pass. Then the game ends.

The engine is pure: `startGame` builds a `GameState`, `getAvailableMoves`
says what the current player may do, and `applyMove` returns a new state or
throws a `GameRuleError` whose message can be shown to players. Return those
errors as 409.

Gifts can carry a `name`. Always send a game to players through
`toPlayerView`, which hides the names of gifts that are still wrapped.

To watch a random game play out in the terminal: `npx tsx scripts/try-game.ts`.

## Stack

- Next.js 16 (App Router), React 19, TypeScript (strict)
- Tailwind CSS v4
- zod for request validation, nanoid for event IDs
- Node 22+

## Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
npm test         # game rule tests
npm run seed     # adds a demo event with a few participants (run again = another demo event)
```

## Layout

| Path | Purpose |
| --- | --- |
| `src/app/` | Pages (`page.tsx`) and API route handlers (`api/**/route.ts`) |
| `src/app/join/[eventId]` | Public share-link sign-up page (server component) |
| `src/app/events/[eventId]/manage` | Organizer dashboard (client, gated by name + email) |
| `src/app/account` | "My account" page (client, gated by name + email) |
| `src/components/` | Shared UI: forms, buttons, the identity gate, copy-link button |
| `src/lib/store.ts` | **The only file that touches storage.** Swap this for a DB later. |
| `src/lib/types.ts` | Shared data types |
| `src/lib/game.ts` | Game rules: turn order, open, steal, freeze, final steal |
| `src/lib/game.test.ts` | Tests for the game rules (`npm test`) |
| `src/lib/validation.ts` | zod schemas for every request body |
| `src/lib/identity-match.ts` | Name + email matching and normalization |
| `src/lib/use-identity.ts` | Client hook that remembers name + email in `localStorage` |
| `src/lib/public-event.ts` | Strips the organizer's email before an event is sent to a client |
| `src/lib/api.ts` | `parseBody` and `apiError` helpers for route handlers |
| `src/lib/client-api.ts` | `callApi` fetch wrapper for client components |
| `scripts/seed.ts` | Demo data script |

## Conventions

- **Storage stays behind `src/lib/store.ts`.** Pages and route handlers call
  its functions and never read `data/store.json` directly.
- **Validate every request body** with a schema from `src/lib/validation.ts`
  using `parseBody`. Never trust raw `request.json()`.
- **Errors** are returned as `{ "error": "message" }` with status 400 (bad
  input), 403 (not allowed), 404 (not found), or 409 (conflict, e.g. sign-ups
  closed or email already used under a different name).
- **Emails are trimmed and lowercased** before storage. Names are trimmed and
  whitespace-collapsed. A name + email "matches" when both are equal,
  ignoring case.
- **Organizer-only actions** check the request's identity against
  `event.organizer` with `identitiesMatch`. Participant actions check against
  the participant record. Organizers may also edit or remove any participant.
- **Event dates** are stored as typed `YYYY-MM-DDTHH:mm` strings with no
  timezone. Format them with `formatEventDate` so the time reads the same for
  everyone.
- **Organizer roster** is loaded with `POST /api/events/[eventId]/roster`
  (not GET) so the organizer's email is not put in the URL.
- **Public event data** must go through `toPublicEvent` before it reaches the
  client. Never send `organizer.email` or other participants' emails to a
  page that anyone with the link can see.

- **Interests poll.** Participants have `interests: string[]`, chosen from the
  fixed `INTERESTS` list in `src/lib/gift-catalog.ts` (up to 8, no free text;
  validation rejects anything else, and `store.ts` drops unknown values on read).
  Every catalog gift is tagged with `INTERESTS` values, so matching is exact.
  When the organizer sets `status: "closed"` in `PATCH /api/events/[eventId]`,
  the route runs `buildGiftIdeas` and saves `giftIdeas` and `giftIdeasAt` on the
  event; closing again regenerates them. `suggestGifts` and `tallyInterests` in
  `src/lib/gift-suggestions.ts` are pure, and the catalog is
  `src/lib/gift-catalog.ts`. Gifts link to an Amazon search, with no affiliate tag.
- **Poll data is public** (`GET /api/events/[eventId]/poll`). Build it only with
  `getPoll` in `src/lib/poll.ts`, which whitelists name and interests. Never
  spread participant records into it, so emails cannot leak. Gift ideas are
  hidden while sign-ups are open.

- **Group chat.** Messages live in `store.json` (`messages`), and images are
  files in `data/uploads/` (next to the data file), both written only through
  `src/lib/store.ts`. Only the organizer and signed-up participants may read or
  post: every chat route calls `loadChatAccess` in `src/lib/chat-access.ts`
  (name + email, not real auth). Reading is `POST` so emails stay out of URLs.
  Sending is multipart form data parsed by `parseMessageForm`. Always send
  messages to a client through `toPublicMessage`, never `authorEmail`.
- **Chat images.** The type is detected from the file's first bytes with
  `detectImageType` (`src/lib/chat-image.ts`), never from the name or the
  browser's type. Only JPEG, PNG, GIF, and WebP up to 5 MB are saved, never SVG.
  Image ids are checked with `isImageId` before they touch the file system. The
  image URL is served without a name + email check (an `<img>` tag can't send
  one), so the unguessable id is the key.
- **Profile pictures.** `Participant.avatar` points at a file in
  `data/uploads/` (the same helpers as chat images). The browser crops and
  shrinks the photo (`src/lib/resize-image.ts`); the server still checks the real
  type and a 1 MB cap. Avatar URLs are looked up by author email when the chat is
  read (`buildAvatarMap` in `src/lib/public-chat.ts`), never stored on messages.
  They are served by `GET /api/events/[eventId]/avatars/[avatarId]` only for a
  picture that belongs to a participant of that event. They are not shown on the
  public join page. Delete the file when a participant leaves or is removed.
- **Reactions.** `ChatMessage.reactions` maps an emoji (one of `REACTION_EMOJIS`
  in `src/lib/reactions.ts`) to reactors' emails. Emails stay server-side:
  clients only get counts and `mine` from `summarizeReactions`.
- **Participant access.** Routes that act on one participant's entry use
  `loadParticipantAccess` in `src/lib/participant-access.ts` (the person or the
  organizer).

## Next.js notes (this version)

This is Next 16 with `cacheComponents: true` in `next.config.ts`. Before
changing routing, caching, or data fetching, read the matching guide in
`node_modules/next/dist/docs/`. Key points:

- Reading request-time data (params, cookies, the database/file store) in a
  server component needs a `<Suspense>` boundary around it, or the build fails.
  The join page and the manage/account gates show this pattern.
- Client components must not read `localStorage` during render. Use
  `useIdentity()`, which waits for the browser before reporting `ready`.
- Call `notFound()` for missing events. It works inside `<Suspense>`.

## Before you open a PR

- `npm run lint`, `npm test`, and `npm run build` all pass.
- Walk through the flow in a browser: create an event, join it from the link
  (in a second browser profile or private window), edit your entry, then
  check the organizer's dashboard and the closed-sign-ups state.
- Do not commit `data/`, `.env*`, or `node_modules/`.
