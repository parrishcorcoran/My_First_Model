export default function About() {
  return (
    <article className="prose prose-invert max-w-2xl">
      <h1 className="text-2xl font-semibold">About this course</h1>
      <p className="mt-4 text-[var(--muted)]">
        A learn-by-implementing curriculum for going from zero to ML engineer.
        Each stage is a runnable Python file under <code>/model</code> plus a
        page on this site that visualizes what the code is doing.
      </p>
      <h2 className="mt-8 text-lg font-medium">How to use it</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-6 text-[var(--muted)]">
        <li>
          Read the intuition + math at the top of each stage&apos;s page.
        </li>
        <li>
          Open the corresponding Python file and read it line by line.
          Comments explain the <em>why</em>, not just the <em>what</em>.
        </li>
        <li>
          Run the demo on this page. Break it on purpose. The exercises at the
          bottom of every stage exist to make you do this.
        </li>
        <li>
          Move on only when you can explain the stage out loud to a rubber
          duck. That&apos;s the bar for &quot;you understand it&quot;.
        </li>
      </ol>
      <h2 className="mt-8 text-lg font-medium">Stack</h2>
      <ul className="mt-3 list-disc space-y-1 pl-6 text-[var(--muted)]">
        <li>Python + PyTorch for the model code.</li>
        <li>FastAPI on Railway exposes each stage as an HTTP endpoint.</li>
        <li>Next.js + Tailwind on Vercel for this site.</li>
      </ul>
    </article>
  );
}
