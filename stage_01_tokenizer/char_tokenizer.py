"""
STAGE 1A: Character-Level Tokenization
=======================================

WHY DO WE TOKENIZE?
-------------------
Neural networks operate on numbers (specifically, vectors of floats).
But our text is a sequence of characters. We need a function:

    encode: str -> list[int]
    decode: list[int] -> str

These integers are *indices into a vocabulary*. Later, an embedding layer
will map each index to a learned d-dimensional vector. So the tokenizer's
only job is to convert text into a sequence of vocabulary indices.

THE THREE STRATEGIES YOU SHOULD KNOW
------------------------------------
1. Character-level: every character is a token.
   - Vocab size: ~100 (ASCII printable) to a few thousand (Unicode)
   - Pros: simple, no OOV, tiny vocab
   - Cons: very long sequences ("hello" = 5 tokens). The model wastes
     capacity learning that 'h-e-l-l-o' is one concept, and attention
     is O(n^2) in sequence length.

2. Word-level: every word is a token.
   - Vocab size: 50k-1M+ depending on corpus
   - Pros: short sequences, "natural" unit
   - Cons: huge vocab (huge embedding matrix), OOV problem for any new
     word, can't share representation across morphology
     ("running" and "ran" become unrelated indices).

3. Subword (BPE, WordPiece, Unigram): tokens are common character
   sequences, *learned from data*.
   - Vocab size: typically 32k-128k for modern LLMs
   - Pros: balances vocab size and sequence length, handles OOV by
     falling back to smaller pieces, captures morphology naturally
   - Cons: more complex; a training step is required
   - This is what GPT-2/3/4, Llama, Claude all use.

We'll start with char-level here because it's the simplest possible
tokenizer and lets us focus on the encode/decode interface. Then in
`bpe_tokenizer.py` we'll implement BPE.

WHY VOCAB SIZE MATTERS (CONNECTING TO LATER STAGES)
---------------------------------------------------
A tokenizer defines a vocabulary V = {t_0, t_1, ..., t_{|V|-1}}.
The model's output at every position is a probability distribution
over V. So |V| directly affects:

  - Embedding matrix size:        (|V|, d_model)
  - Output projection size:       (d_model, |V|)
  - Output softmax cost per step: O(|V|)
  - Sequence length for a given amount of text

For a 50k-vocab GPT-2-style model with d_model=768, the embedding +
output matrices alone are ~80M parameters out of ~125M total. So your
tokenizer choice has a *huge* impact on model size.
"""


class CharTokenizer:
    """Maps each unique character in the training text to an integer id."""

    def __init__(self, text: str) -> None:
        # Find every unique character. sorted() makes the mapping
        # deterministic — re-running on the same text gives the same vocab.
        chars = sorted(set(text))

        # We need both directions:
        #   stoi: string -> int   (used in encode)
        #   itos: int -> string   (used in decode)
        self.stoi: dict[str, int] = {ch: i for i, ch in enumerate(chars)}
        self.itos: dict[int, str] = {i: ch for i, ch in enumerate(chars)}
        self.vocab_size: int = len(chars)

    def encode(self, text: str) -> list[int]:
        """text -> list of token ids."""
        return [self.stoi[ch] for ch in text]

    def decode(self, ids: list[int]) -> str:
        """list of token ids -> text."""
        return "".join(self.itos[i] for i in ids)


# ---------------------------------------------------------------------------
# EXERCISES (try these — they're the kind of question interviewers ask):
#
# 1. What happens if you call encode() on a string with a character that
#    wasn't in the training text? (Try it.) This is the OOV problem in
#    its simplest form. How would you fix it? (Hint: <unk> token.)
#
# 2. Encode the same paragraph with this tokenizer and with a hypothetical
#    word-level tokenizer. Which produces a longer sequence? By how much?
#    Why does that matter for transformer compute (which is O(n^2))?
#
# 3. Vocab size of this tokenizer depends entirely on what characters
#    appeared in the training text. Why is that a problem in production?
#    What's the fix? (Hint: byte-level — there are only 256 possible bytes.)
#
# 4. Modify CharTokenizer to support an <unk> token that any unseen char
#    maps to. What's the tradeoff? (You lose information — '€' and '中'
#    both become <unk> and are indistinguishable to the model.)
# ---------------------------------------------------------------------------


if __name__ == "__main__":
    sample = "hello world"
    tok = CharTokenizer(sample)
    print(f"vocab_size: {tok.vocab_size}")
    print(f"vocab:      {list(tok.stoi.keys())}")

    ids = tok.encode("hello")
    print(f"encode('hello') = {ids}")
    print(f"decode({ids}) = {tok.decode(ids)!r}")

    # Sanity check: round-trip should be identity
    assert tok.decode(tok.encode(sample)) == sample
    print("round-trip ok")
