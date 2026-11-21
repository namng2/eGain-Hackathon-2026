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
| `/events/<eventId>/chat` | Organizer and people signed up | Group chat for the event, with optional images |

## Interests poll and gift ideas

When signing up, people **pick up to 8 interests and hobbies from a fixed list** (coffee, hiking, board games, and so on). They can change their picks and gift hint later from the account page, until the organizer closes sign-ups. Everyone with the share link sees the poll on the join page: the top interests, and each person's name with their interests. Emails are never shown.

When the organizer **closes sign-ups**, the app turns the poll into up to 6 **gift ideas** within the event budget, picked from a built-in sample catalog (`src/lib/gift-catalog.ts`), scored by how many people picked the interests each gift is tagged with. To add an interest option, add it to `INTERESTS` there and tag at least one gift with it. Each idea has an emoji tile and a link to an Amazon search. There are no real product photos, prices, or affiliate tags. Reopening and closing again regenerates the ideas from the latest answers.

## Important: no login yet

There are no passwords or accounts. "Who you are" is the **name and email** you type, which the browser remembers.
Anyone who knows someone's name and email can act as them. Do not use this for anything sensitive. Real sign-in is the next step.

## Group chat

Each event has a group chat at `/events/<eventId>/chat`, linked from the organizer dashboard, the account page, and the sign-up confirmation. The organizer and everyone signed up can read and post. Messages can include text (up to 1000 characters), one image (JPEG, PNG, GIF, or WebP, up to 5 MB), or both. The chat refreshes itself about every 3 seconds. You can delete your own messages, and the organizer can delete any message. The chat stays open after sign-ups close.

The chat page shows an event banner, a "Who's here" row, and a short welcome note. Tap **React** under any message to add 👍 😂 🎁 🔥 or ❤️ (tap again to take it back).

**Profile pictures.** People can add an optional profile picture when they sign up, and add, change, or remove it any time from the account page (even after sign-ups close). It is cropped to a small square in the browser first. It shows next to their messages and in "Who's here", never on the public join page. Without one, the chat shows a colored circle with their initials.

Access is checked by name and email (or phone number) like the rest of the app, so it is only as private as that is: anyone who knows a participant's name and email or phone can read the chat.

## Where data is stored

Everything is in one JSON file: `data/store.json`, created on first write. Chat images and profile pictures are saved as files in `data/uploads/`. The whole `data/` folder is gitignored.
Delete the folder to start over.

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
| `POST /api/events/:id/chat` | Organizer or participant | Read the latest chat messages (no emails) |
| `POST /api/events/:id/chat/messages` | Organizer or participant | Post a message (multipart form: name, email or phone, text, optional image) |
| `DELETE /api/events/:id/chat/messages/:messageId` | Author or organizer | Delete a message and its image |
| `GET /api/events/:id/chat/images/:imageId` | Anyone with the image link | Serve a chat image |
| `POST /api/events/:id/chat/messages/:messageId/reactions` | Organizer or participant | Add or remove your emoji reaction |
| `POST /api/participants/:id/avatar` | Participant or organizer | Set or replace a profile picture (multipart form: name, email or phone, image, max 1 MB) |
| `DELETE /api/participants/:id/avatar` | Participant or organizer | Remove a profile picture |
| `GET /api/events/:id/avatars/:avatarId` | Anyone with the picture link | Serve a profile picture |

Errors are returned as `{ "error": "..." }` with status 400, 403, 404, or 409.

## Next steps

- Real sign-in (for example email magic links), so identity can be verified
- A real database behind `src/lib/store.ts`
- Game play: draw order, opening and stealing gifts, steal limits
- Emails with the share link and reminders
