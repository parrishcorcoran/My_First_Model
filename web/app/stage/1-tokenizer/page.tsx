"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  bpeTokenize,
  charTokenize,
  type BPEResponse,
  type CharResponse,
  type TokenPiece,
} from "@/lib/api";

const DEFAULT_CORPUS = `the cat sat on the mat. the cat ate the rat.
the rat ran from the cat. the dog and the cat sat together.
to be or not to be, that is the question.`;

const DEFAULT_TEXT = "the cat sat";

export default function Stage1Page() {
  const [corpus, setCorpus] = useState(DEFAULT_CORPUS);
  const [text, setText] = useState(DEFAULT_TEXT);
  const [numMerges, setNumMerges] = useState(30);
  const [charResult, setCharResult] = useState<CharResponse | null>(null);
  const [bpeResult, setBpeResult] = useState<BPEResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Re-tokenize whenever inputs change. Debounced so we don't spam the API.
  useEffect(() => {
    const handle = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const [c, b] = await Promise.all([
          charTokenize(corpus, text),
          bpeTokenize(corpus, text, numMerges),
        ]);
        setCharResult(c);
        setBpeResult(b);
      } catch (e) {
        setError(e instanceof Error ? e.message : "request failed");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [corpus, text, numMerges]);

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
            stage 01
          </span>
          <span className="rounded border border-[var(--accent)] px-2 py-0.5 font-mono text-xs text-[var(--accent)]">
            live
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Tokenization
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Models eat numbers, not text. A tokenizer maps strings to integer
          ids. The choice between character-level and Byte-Pair Encoding (BPE)
          is a tradeoff between vocabulary size and sequence length — and the
          choice ripples through the entire model&apos;s compute budget.
        </p>
      </header>

      <Section title="Try it">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Training corpus">
            <textarea
              value={corpus}
              onChange={(e) => setCorpus(e.target.value)}
              rows={6}
              className="w-full resize-y rounded border border-[var(--border)] bg-black/30 p-3 font-mono text-xs"
            />
          </Field>
          <Field label="Test text">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="w-full resize-y rounded border border-[var(--border)] bg-black/30 p-3 font-mono text-xs"
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label={`BPE merges: ${numMerges}`}>
            <input
              type="range"
              min={0}
              max={200}
              value={numMerges}
              onChange={(e) => setNumMerges(parseInt(e.target.value))}
              className="w-full"
            />
          </Field>
        </div>
        {loading && (
          <p className="mt-3 font-mono text-xs text-[var(--muted)]">
            tokenizing…
          </p>
        )}
        {error && (
          <p className="mt-3 font-mono text-xs text-red-400">{error}</p>
        )}
      </Section>

      <Section title="Character-level tokenizer">
        <p className="mb-3 text-sm text-[var(--muted)]">
          Vocab = every unique character in the corpus. Simple, no OOV
          (unless the test text contains unseen chars), but sequences are
          long.
        </p>
        {charResult && (
          <Stats
            stats={[
              ["vocab size", charResult.vocab_size],
              ["sequence length", charResult.tokens.length],
              ["chars / token", charResult.chars_per_token.toFixed(2)],
            ]}
          />
        )}
        {charResult && <TokenStrip tokens={charResult.tokens} variant="char" />}
      </Section>

      <Section title="BPE tokenizer">
        <p className="mb-3 text-sm text-[var(--muted)]">
          Start from characters; greedily merge the most frequent adjacent
          pair, repeat <span className="font-mono">N</span> times. Frequent
          substrings become single tokens; rare ones stay decomposed. This is
          what GPT-2/3/4 do (with byte-level vocab).
        </p>
        {bpeResult && (
          <Stats
            stats={[
              ["vocab size", bpeResult.vocab_size],
              ["sequence length", bpeResult.tokens.length],
              ["chars / token", bpeResult.chars_per_token.toFixed(2)],
            ]}
          />
        )}
        {bpeResult && <TokenStrip tokens={bpeResult.tokens} variant="bpe" />}
        {bpeResult && bpeResult.merges.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer font-mono text-xs text-[var(--muted)]">
              learned merges (first 20)
            </summary>
            <ol className="mt-3 grid grid-cols-1 gap-1 font-mono text-xs sm:grid-cols-2">
              {bpeResult.merges.slice(0, 20).map((m, i) => (
                <li key={i} className="text-[var(--muted)]">
                  <span className="mr-2 text-[var(--muted)]/60">
                    {String(i).padStart(2, "0")}
                  </span>
                  {JSON.stringify(m.a)} + {JSON.stringify(m.b)} →{" "}
                  <span className="text-[var(--accent)]">
                    {JSON.stringify(m.merged)}
                  </span>
                </li>
              ))}
            </ol>
          </details>
        )}
      </Section>

      <Section title="What to notice">
        <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--muted)]">
          <li>
            Drop merges to 0: BPE collapses to char-level. Crank it up: vocab
            grows, sequence shrinks. That&apos;s the whole knob.
          </li>
          <li>
            Try a test word that&apos;s not in the corpus but uses only chars
            that are. BPE breaks it into smaller pieces gracefully — no OOV.
          </li>
          <li>
            Sequence length matters: attention is{" "}
            <span className="font-mono">O(n²)</span>. Halving sequence length
            quarters attention compute.
          </li>
        </ul>
      </Section>

      <Section title="The code">
        <p className="text-sm text-[var(--muted)]">
          This page calls the actual Python you can read in the repo:
        </p>
        <ul className="mt-2 space-y-1 font-mono text-xs">
          <li>
            <code>model/stage_01_tokenizer/char_tokenizer.py</code>
          </li>
          <li>
            <code>model/stage_01_tokenizer/bpe_tokenizer.py</code>
          </li>
          <li>
            <code>api/main.py</code> — exposes them as HTTP endpoints
          </li>
        </ul>
      </Section>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-mono text-sm uppercase tracking-wider text-[var(--muted)]">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-xs text-[var(--muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Stats({ stats }: { stats: [string, string | number][] }) {
  return (
    <dl className="mb-4 grid grid-cols-3 gap-3 rounded border border-[var(--border)] p-3">
      {stats.map(([k, v]) => (
        <div key={k}>
          <dt className="font-mono text-xs uppercase text-[var(--muted)]">
            {k}
          </dt>
          <dd className="font-mono text-lg">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function TokenStrip({
  tokens,
  variant,
}: {
  tokens: TokenPiece[];
  variant: "char" | "bpe";
}) {
  // Color tokens by id so the eye can spot repeats. Hash the id into a hue.
  const hue = (id: number) => (id * 47) % 360;
  return (
    <div className="rounded border border-[var(--border)] bg-black/30 p-3">
      <div className="flex flex-wrap gap-1 font-mono text-xs">
        {tokens.map((t, i) => (
          <span
            key={i}
            title={`id=${t.id}`}
            className="rounded px-1.5 py-0.5"
            style={{
              backgroundColor: `hsl(${hue(t.id)} 60% 25% / 0.8)`,
              color: `hsl(${hue(t.id)} 80% 85%)`,
            }}
          >
            {/* show whitespace explicitly so it's visible */}
            {visualize(t.piece)}
          </span>
        ))}
      </div>
      <p className="mt-3 font-mono text-[10px] text-[var(--muted)]">
        each chip is one token; color = id ({variant} tokenizer)
      </p>
    </div>
  );
}

function visualize(s: string): string {
  // Render leading spaces and newlines visibly so chips don't look empty.
  return s.replace(/ /g, "·").replace(/\n/g, "↵");
}
