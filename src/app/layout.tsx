import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.tagline,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-stone-50 text-stone-900">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              {site.name}
            </Link>
            <nav className="flex gap-4 text-sm font-medium text-stone-700">
              <Link href="/create" className="hover:text-emerald-800">
                Create event
              </Link>
              <Link href="/account" className="hover:text-emerald-800">
                My account
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-10">
          {children}
        </main>
        <footer className="border-t border-stone-200">
          <div className="mx-auto max-w-3xl px-4 py-4 text-xs text-stone-500">
            Early draft · data is stored on the server in a JSON file · no login yet
          </div>
        </footer>
      </body>
    </html>
  );
}
