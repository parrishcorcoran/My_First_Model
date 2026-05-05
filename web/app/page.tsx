import Link from "next/link";
import { STAGES } from "@/lib/stages";

export default function Home() {
  return (
    <div>
      <section className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Build an LLM from scratch.
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Ten stages, each one a runnable chunk of Python plus an interactive
          page that visualizes it. The goal isn&apos;t to use a transformer —
          it&apos;s to understand every line. By the end you&apos;ll have a
          working chat model and the deep intuition that makes ML interviews
          go well.
        </p>
      </section>

      <ol className="space-y-3">
        {STAGES.map((s) => (
          <li key={s.num}>
            <Link
              href={`/stage/${s.num}-${s.slug}`}
              className={
                "block rounded-lg border border-[var(--border)] p-5 transition-colors " +
                (s.status === "live"
                  ? "hover:border-[var(--accent)]"
                  : "opacity-70 hover:opacity-90")
              }
            >
              <div className="flex items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm text-[var(--muted)]">
                    {String(s.num).padStart(2, "0")}
                  </span>
                  <h2 className="text-lg font-medium">{s.title}</h2>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">{s.intuition}</p>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StatusBadge({ status }: { status: "live" | "drafting" | "planned" }) {
  const label =
    status === "live" ? "live" : status === "drafting" ? "drafting" : "planned";
  const cls =
    status === "live"
      ? "text-[var(--accent)] border-[var(--accent)]"
      : "text-[var(--muted)] border-[var(--border)]";
  return (
    <span
      className={`shrink-0 rounded border px-2 py-0.5 font-mono text-xs ${cls}`}
    >
      {label}
    </span>
  );
}
