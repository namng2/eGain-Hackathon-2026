import type { Metadata } from "next";
import { Montserrat, Mountains_of_Christmas } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";
import { site } from "@/lib/site";

const bodyFont = Montserrat({
  subsets: ["latin"],
  display: "swap",
});

const festive = Mountains_of_Christmas({
  weight: ["700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.tagline,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className={`${bodyFont.className} flex min-h-full flex-col bg-[#fdf7f4] bg-[url('/christmas-dark-trees.jpg')] bg-fixed bg-cover bg-center text-stone-900`}
      >
        <header className="bg-red-700 font-[ui-sans-serif,system-ui,sans-serif] text-white shadow-sm">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-4 py-3">
            <Link
              href="/"
              className={`flex items-center gap-2 text-2xl uppercase tracking-widest ${festive.className}`}
            >
              {site.name}
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5 fill-yellow-300"
              >
                <path d="M12 2 L17 9 H14 L19 15 H5 L10 9 H7 Z M11 15 H13 V22 H11 Z" />
              </svg>
            </Link>
            <nav className="flex gap-5 text-sm font-semibold uppercase tracking-wide text-red-50">
              <Link href="/create" className="hover:text-yellow-200">
                Create event
              </Link>
              <Link href="/join" className="hover:text-yellow-200">
                Join event
              </Link>
              <Link href="/account" className="hover:text-yellow-200">
                My account
              </Link>
            </nav>
          </div>
          <div
            className="h-1.5 bg-[repeating-linear-gradient(45deg,#ffffff_0_8px,#15803d_8px_16px)]"
            aria-hidden="true"
          />
        </header>
        <main className="mx-4 my-6 flex-1 rounded-2xl bg-white/90 px-4 py-8 shadow-lg backdrop-blur-sm sm:mx-auto sm:max-w-3xl sm:px-8 sm:py-10">
          {children}
        </main>
        <footer className="border-t-4 border-green-800 bg-green-900 text-green-50">
          <div className="mx-auto max-w-5xl whitespace-nowrap px-4 py-4 text-center text-sm italic text-green-100">
            &ldquo;May you never be too grown up to search the skies on Christmas Eve.&rdquo;
          </div>
        </footer>
      </body>
    </html>
  );
}
