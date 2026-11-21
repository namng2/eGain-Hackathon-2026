/**
 * Adds a demo event with a few sign-ups so the app has something to look at.
 *
 *   npm run seed
 *
 * Running it again adds another demo event (it does not replace the old one).
 */
import { createEvent, upsertParticipant } from "../src/lib/store";

async function main() {
  const event = await createEvent({
    name: "Holiday White Elephant 2026",
    companyName: "Acme Corp",
    date: "2026-12-18T12:00",
    location: "Break room 2, or the video link in the invite",
    budget: 25,
    stealLimit: 3,
    rules: "Wrapped gifts only. No electronics over $10.",
    organizer: {
      name: "Demo Organizer",
      email: "organizer@example.com",
      phone: "",
    },
  });

  const people = [
    {
      name: "Alex Rivera",
      email: "alex@example.com",
      phone: "",
      department: "Engineering",
      attendance: "in_person" as const,
      gift: "Mini succulent set",
      interests: ["gardening", "coffee", "hiking"],
    },
    {
      name: "Priya Shah",
      email: "",
      phone: "+15555550123",
      department: "Support",
      attendance: "remote" as const,
      gift: "Cooperative board game",
      interests: ["board games", "coffee", "reading"],
    },
    {
      name: "Sam Okafor",
      email: "sam@example.com",
      phone: "",
      department: "Sales",
      attendance: "in_person" as const,
      gift: "Gourmet snack box",
      interests: ["cooking", "running", "board games"],
    },
  ];
  for (const person of people) {
    await upsertParticipant(event.id, person);
  }

  console.log(`Created "${event.name}" with ${people.length} sign-ups.`);
  console.log(`Share link path: /join/${event.id}`);
  console.log("Organizer sign-in: Demo Organizer / organizer@example.com");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
