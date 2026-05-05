import Link from "next/link";
import { notFound } from "next/navigation";
import { STAGES } from "@/lib/stages";

// Fallback page for stages that haven't been built yet. Stage 1 has its
// own dedicated route at app/stage/1-tokenizer/page.tsx, which Next.js
// matches before this dynamic segment.

export function generateStaticParams() {
  return STAGES.map((s) => ({ slug: `${s.num}-${s.slug}` }));
}

export default async function StagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const stage = STAGES.find((s) => `${s.num}-${s.slug}` === slug);
  if (!stage) notFound();

  return (
    <article>
      <Link
        href="/"
        className="font-mono text-xs text-[var(--muted)] hover:text-[var(--fg)]"
      >
        ← all stages
      </Link>
      <header className="mt-4">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-sm text-[var(--muted)]">
            stage {String(stage.num).padStart(2, "0")}
          </span>
          <span className="rounded border border-[var(--border)] px-2 py-0.5 font-mono text-xs text-[var(--muted)]">
            {stage.status}
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {stage.title}
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">{stage.intuition}</p>
      </header>

      <section className="mt-10">
        <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--muted)]">
          Learning goals
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {stage.learningGoals.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-lg border border-dashed border-[var(--border)] p-8 text-center">
        <p className="font-mono text-sm text-[var(--muted)]">
          this stage hasn&apos;t been built yet
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          the code, math, and interactive demo show up here once stage{" "}
          {stage.num} is in progress
        </p>
      </section>
    </article>
  );
}
