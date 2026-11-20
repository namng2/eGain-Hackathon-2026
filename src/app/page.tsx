import Link from "next/link";
import { Card, buttonClasses } from "@/components/ui";
import { site } from "@/lib/site";

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
    body: "People add their name, email, and gift hint, and can update their entry later.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-800">
          Office gift swap
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Run your white elephant from one link.
        </h1>
        <p className="max-w-xl text-stone-600">{site.tagline}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/create" className={buttonClasses("primary")}>
            Create an event
          </Link>
          <Link href="/account" className={buttonClasses("secondary")}>
            Manage my account
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                  {index + 1}
                </span>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-stone-600">{step.body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-xs text-stone-500">
        This is an early draft. There&apos;s no login yet, so you manage your entry by
        typing the name and email you signed up with. Anyone who knows those details
        can do the same, so don&apos;t treat this as private.
      </p>
    </div>
  );
}
