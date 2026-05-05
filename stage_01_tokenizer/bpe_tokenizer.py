"""
STAGE 1B: Byte-Pair Encoding (BPE) Tokenizer
=============================================

THE IDEA
--------
Char-level tokenization makes sequences too long. Word-level makes the
vocab too large and breaks on new words. BPE is a middle path: it
*learns* a vocabulary of frequent character sequences from a corpus.

After training, frequent strings like ' the', 'ing', 'tion' become a
single token, while rare or novel strings stay broken into smaller
pieces. So the average token covers ~4 chars on English text, but no
input ever fails to encode.

TRAINING ALGORITHM
------------------
Input: a text corpus, a target number of merges N.

1. Pre-tokenize: split the text into "words" (e.g. by whitespace),
   each represented as a list of single-character tokens.
       "the cat" -> [['t','h','e'], [' ','c','a','t']]

2. Initialize the vocab as the set of all characters that appear.

3. Repeat N times:
   a. Count every adjacent pair of tokens across all words.
      e.g. {('t','h'): 14, ('h','e'): 22, ('c','a'): 8, ...}
   b. Find the most frequent pair, say ('h','e').
   c. Add the merged token 'he' to the vocab and record the merge.
   d. In every word, replace every adjacent ('h','e') with 'he'.

After N merges, |V| = (initial chars) + N. (Each merge adds exactly
one new token because pre-existing merges of the same string would
not show up as a "pair" anymore.)

ENCODING NEW TEXT
-----------------
1. Pre-tokenize the same way.
2. For each word, repeatedly apply the learned merges *in the order
   they were learned*. Earlier merges have higher priority.
3. Look up the final pieces in the vocab to get token ids.

The "earlier first" rule is critical: it guarantees that encoding the
exact training corpus reproduces the training-time tokenization, and
that encode/decode is deterministic.

WHY IT WORKS (INTUITION)
------------------------
Frequent substrings deserve their own token because the model would
otherwise spend capacity learning that they're a unit. Rare/novel
substrings stay decomposed, but they never fail because the initial
vocab contains every possible base unit. So BPE has *no OOV problem*
as long as encode-time characters are a subset of train-time
characters.

WHY "BYTE"-LEVEL BPE? (the GPT-2 trick)
---------------------------------------
Real-world text contains every Unicode character — emoji, CJK,
mathematical symbols, control characters, the lot. To make OOV
*literally impossible*, GPT-2 treats input as raw UTF-8 bytes. There
are only 256 possible bytes, so the initial vocab has exactly 256
entries and any conceivable input encodes. The BPE algorithm itself
is unchanged.

We'll do char-level here for clarity. The byte-level extension is a
two-line change (encode the string to UTF-8 bytes first, decode at
the end).

COMPLEXITY
----------
Naive (this implementation):
    Per merge: O(corpus_size) to count + O(corpus_size) to replace.
    Total: O(N * corpus_size).
Production (e.g. tiktoken, sentencepiece):
    Use linked lists + a priority queue keyed on pair frequency, so
    each merge is closer to O(log N + count_of_affected_pairs).
We do the naive version because clarity > speed at this stage.
"""

from collections import Counter


class BPETokenizer:
    """Byte-Pair Encoding tokenizer. Train, then encode/decode."""

    def __init__(self) -> None:
        # Ordered list of merges, oldest first. Order = priority during encode.
        self.merges: list[tuple[str, str]] = []
        # token string -> integer id
        self.vocab: dict[str, int] = {}
        # integer id -> token string
        self.inv_vocab: dict[int, str] = {}

    # ---------- training ----------------------------------------------------

    def train(self, text: str, num_merges: int) -> None:
        """Learn `num_merges` BPE merges from `text`."""

        # Step 1: pre-tokenize. We split on whitespace and prepend a
        # space to all but the first word. This is roughly what GPT-2
        # does — it lets the tokenizer learn that ' the' (mid-sentence)
        # is different from 'the' (start of line). Without this, every
        # word would have a stand-alone copy and a "with-leading-space"
        # copy and the vocab would be bloated.
        words: list[list[str]] = []
        for i, w in enumerate(text.split(" ")):
            if not w:
                continue
            piece = (" " + w) if i > 0 else w
            words.append(list(piece))  # list of single-char strings

        # Step 2: initial vocab is every character that appears.
        chars = sorted({c for w in words for c in w})
        self.vocab = {c: i for i, c in enumerate(chars)}
        self.merges = []

        # Step 3: do `num_merges` greedy merge iterations.
        for _ in range(num_merges):
            # 3a. Count every adjacent pair across all words.
            #     zip(w, w[1:]) gives consecutive pairs in a list.
            pair_counts: Counter = Counter()
            for w in words:
                for a, b in zip(w, w[1:]):
                    pair_counts[(a, b)] += 1

            if not pair_counts:
                break  # corpus has no adjacencies left to merge

            # 3b. Pick the most frequent pair. Ties broken by Counter's
            #     insertion order, which is fine for our purposes —
            #     production tokenizers add a deterministic tie-breaker.
            best_pair = max(pair_counts, key=pair_counts.get)
            a, b = best_pair
            new_token = a + b

            # 3c. Add to vocab and record the merge (order matters!).
            self.vocab[new_token] = len(self.vocab)
            self.merges.append(best_pair)

            # 3d. Apply the merge to every word.
            words = [self._merge_word(w, a, b, new_token) for w in words]

        # Build inverse for decode().
        self.inv_vocab = {i: t for t, i in self.vocab.items()}

    @staticmethod
    def _merge_word(
        word: list[str], a: str, b: str, merged: str
    ) -> list[str]:
        """Replace every adjacent (a, b) in `word` with `merged`.

        We scan left-to-right, consuming two tokens whenever we hit the
        target pair and one token otherwise. This is greedy and
        non-overlapping, which is what BPE expects.
        """
        out: list[str] = []
        i = 0
        n = len(word)
        while i < n:
            if i < n - 1 and word[i] == a and word[i + 1] == b:
                out.append(merged)
                i += 2
            else:
                out.append(word[i])
                i += 1
        return out

    # ---------- inference ---------------------------------------------------

    def encode(self, text: str) -> list[int]:
        """Apply the learned merges to tokenize new text."""

        # Same pre-tokenization as training.
        words: list[list[str]] = []
        for i, w in enumerate(text.split(" ")):
            if not w:
                continue
            piece = (" " + w) if i > 0 else w
            words.append(list(piece))

        # Apply merges in the order they were learned. Earlier merges =
        # higher priority. This is what makes BPE deterministic.
        for a, b in self.merges:
            words = [self._merge_word(w, a, b, a + b) for w in words]

        # Flatten and look up ids.
        ids: list[int] = []
        for w in words:
            for tok in w:
                if tok not in self.vocab:
                    # Could happen if the encode-time text contains a
                    # character that wasn't in the training corpus.
                    # Real byte-level BPE never hits this because the
                    # initial vocab covers all 256 bytes.
                    raise KeyError(
                        f"token {tok!r} not in vocab — char-level BPE "
                        f"can't encode unseen characters. Use byte-level."
                    )
                ids.append(self.vocab[tok])
        return ids

    def decode(self, ids: list[int]) -> str:
        return "".join(self.inv_vocab[i] for i in ids)


# ---------------------------------------------------------------------------
# EXERCISES:
#
# 1. Train BPE on a small corpus with num_merges in {0, 10, 50, 200}.
#    Print the merges list each time. Which pairs get merged first?
#    Why those? (Hint: count adjacencies in the raw text by hand.)
#
# 2. Encode a word that wasn't in the training corpus, but uses only
#    characters that *were* in training. Verify the encoding falls back
#    gracefully to smaller pieces. This is BPE's superpower.
#
# 3. Now try to encode a string with an emoji. It will KeyError. Modify
#    `train` to start from raw UTF-8 bytes instead of characters. Show
#    that the modified tokenizer can encode any input.
#
# 4. The naive _merge_word is O(L) per word per merge, so training is
#    O(N * total_chars). For a 1GB corpus and N=50k merges, that's
#    untenable. Read the tiktoken source — it uses a doubly-linked
#    list per word + a max-heap of pair frequencies, so each merge is
#    O(log N + affected_pairs). You should be able to explain this in
#    an interview.
#
# 5. Why do we attach the leading space to the *next* word (' the')
#    rather than the previous one ('the ')? Hint: think about what
#    happens at sentence boundaries and what the model has to predict.
# ---------------------------------------------------------------------------


if __name__ == "__main__":
    corpus = (
        "the cat sat on the mat. "
        "the cat ate the rat. "
        "the rat ran from the cat. "
        "the cat and the rat sat."
    )
    tok = BPETokenizer()
    tok.train(corpus, num_merges=20)

    print(f"vocab size: {len(tok.vocab)}")
    print(f"first 10 merges:")
    for i, m in enumerate(tok.merges[:10]):
        print(f"  {i}: {m[0]!r} + {m[1]!r}  ->  {(m[0]+m[1])!r}")

    test = "the cat sat"
    ids = tok.encode(test)
    pieces = [tok.inv_vocab[i] for i in ids]
    print()
    print(f"encode({test!r}) = {ids}")
    print(f"  pieces = {pieces}")
    print(f"decode({ids}) = {tok.decode(ids)!r}")

    assert tok.decode(tok.encode(test)) == test
    print("round-trip ok")
