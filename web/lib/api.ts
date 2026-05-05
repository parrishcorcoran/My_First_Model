// Single point where the frontend talks to the FastAPI backend.
// The base URL comes from NEXT_PUBLIC_API_URL — set this in Vercel
// to your Railway deployment, e.g. https://my-first-model.up.railway.app
//
// We deliberately don't fall back to localhost in production so that a
// missing env var fails loudly rather than silently hitting nothing.

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type TokenPiece = { id: number; piece: string };

export type CharResponse = {
  vocab_size: number;
  tokens: TokenPiece[];
  chars_per_token: number;
};

export type BPEMerge = { a: string; b: string; merged: string };

export type BPEResponse = {
  vocab_size: number;
  merges: BPEMerge[];
  tokens: TokenPiece[];
  chars_per_token: number;
};

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const detail = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(detail.detail ?? `Request failed: ${r.status}`);
  }
  return r.json();
}

export const charTokenize = (corpus: string, text: string) =>
  post<CharResponse>("/api/stage1/char", { corpus, text });

export const bpeTokenize = (
  corpus: string,
  text: string,
  numMerges: number,
) =>
  post<BPEResponse>("/api/stage1/bpe", {
    corpus,
    text,
    num_merges: numMerges,
  });
