# White Elephant

A small web app for running an office **white elephant gift exchange**.

1. An organizer creates an event and gets a **share link**.
2. Colleagues open the link and **sign up**.
3. Everyone **manages their own entry** from the account page.

This is an early draft. Game play (draw order, opening and stealing gifts) is not built yet.

## Getting started

Requires Node.js 22 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
```

Optional demo data:

```bash
npm run seed       # adds "Holiday White Elephant 2026" with three sign-ups
```

## Pages

| Path | Who | What |
| --- | --- | --- |
| `/` | Everyone | Home page |
| `/create` | Organizer | Create an event |
| `/join/<eventId>` | Anyone with the link | Event details and sign-up form |
| `/events/<eventId>/manage` | Organizer | Share link, sign-up controls, event details, participant list, CSV export |
| `/account` | Anyone | Events you organize and events you joined. Edit or leave your entry. |

## Interests poll and gift ideas

When signing up, people **pick up to 8 interests and hobbies from a fixed list** (coffee, hiking, board games, and so on). They also say what gift they're bringing, which stays secret until it's unwrapped in the game. They can change their picks and gift later from the account page, until the organizer closes sign-ups. Everyone with the share link sees the poll on the join page: the top interests, and each person's name with their interests. Emails are never shown.

When the organizer **closes sign-ups**, the app turns the poll into up to 6 **gift ideas** within the event budget, picked from a built-in sample catalog (`src/lib/gift-catalog.ts`), scored by how many people picked the interests each gift is tagged with. To add an interest option, add it to `INTERESTS` there and tag at least one gift with it. Each idea has an emoji tile and a link to an Amazon search. There are no real product photos, prices, or affiliate tags. Reopening and closing again regenerates the ideas from the latest answers.

## Important: no login yet

There are no passwords or accounts. "Who you are" is the **name and email** you type, which the browser remembers.
Anyone who knows someone's name and email can act as them. Do not use this for anything sensitive. Real sign-in is the next step.

## Where data is stored

Everything is in one JSON file: `data/store.json`, created on first write. The folder is gitignored.
Delete the file to start over.

All reads and writes go through `src/lib/store.ts`. Replacing that file with a database later should not require changes to pages or API routes.

## Project layout

```
src/
  app/            pages and API route handlers
  components/     shared UI and client-side forms
  lib/            types, validation (zod), store, helpers
scripts/seed.ts   demo data
```

See [AGENTS.md](AGENTS.md) for conventions and notes for contributors.

## API (summary)

| Method and path | Who | Purpose |
| --- | --- | --- |
| `POST /api/events` | Anyone | Create an event |
| `GET /api/events/:id` | Anyone | Public event details |
| `PATCH /api/events/:id` | Organizer | Edit details, open or close sign-ups. Closing also generates gift ideas. |
| `GET /api/events/:id/poll` | Anyone | Names and interests, top interests, and gift ideas (no emails) |
| `POST /api/events/:id/roster` | Organizer | Full participant list (includes emails) |
| `POST /api/events/:id/participants` | Anyone | Sign up, or update an existing entry with the same name and email |
| `PATCH /api/participants/:id` | Participant or organizer | Change an entry (blocked when sign-ups are closed, except for the organizer) |
| `DELETE /api/participants/:id` | Participant or organizer | Leave an event, or remove someone |
| `POST /api/account` | Anyone (with name and email) | Events organized and joined |

Errors are returned as `{ "error": "..." }` with status 400, 403, 404, or 409.

## Next steps

- Real sign-in (for example email magic links), so identity can be verified
- A real database behind `src/lib/store.ts`
- Game play: draw order, opening and stealing gifts, steal limits
- Emails with the share link and reminders
