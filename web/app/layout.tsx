import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM From Scratch — Course",
  description:
    "Build a transformer-based language model from scratch, one stage at a time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-[var(--border)] px-6 py-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <Link href="/" className="font-mono text-sm">
              llm-from-scratch
            </Link>
            <nav className="flex gap-4 text-sm text-[var(--muted)]">
              <Link href="/">Stages</Link>
              <Link href="/about">About</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        <footer className="mx-auto max-w-5xl px-6 py-10 text-xs text-[var(--muted)]">
          A learn-by-implementing course. Code:{" "}
          <a href="https://github.com/parrishcorcoran/my_first_model">github</a>
          .
        </footer>
      </body>
    </html>
  );
}
