import { Caveat } from "next/font/google";
import Link from "next/link";
import { Card, buttonClasses } from "@/components/ui";
import { site } from "@/lib/site";

const headlineFont = Caveat({
  weight: ["700"],
  subsets: ["latin"],
  display: "swap",
});

const steps = [
  {
    title: "Create an event",
    body: "Add the date, location, gift budget, and any rules.",
  },
  {
    title: "Share the link",
    body: "Send one link to everyone. No accounts to set up.",
  },
  {
    title: "Everyone signs up",
    body: "People join with the link, then add their name, email or phone, interests, and the gift they're bringing. They can update their entry later.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12 text-center">
      <section className="space-y-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-green-800">
          Office gift swap
        </p>
        <h1
          className={`${headlineFont.className} whitespace-nowrap text-center text-[clamp(1.125rem,5vw,2.75rem)] font-bold leading-tight`}
        >
          White elephant with your coworkers!
        </h1>
        <p className="mx-auto max-w-xl text-stone-600">{site.tagline}</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/create" className={buttonClasses("primary")}>
            Create an event
          </Link>
          <Link href="/join" className={buttonClasses("primary")}>
            Join an event
          </Link>
          <Link href="/account" className={buttonClasses("secondary")}>
            Manage my account
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">How it works</h2>
        <ol className="grid gap-4 text-center sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full">
                <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-800">
                  {index + 1}
                </span>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-stone-600">{step.body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

    </div>
  );
}
