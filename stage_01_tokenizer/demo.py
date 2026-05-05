"""
Stage 1 demo: compare char-level and BPE tokenization on the same text.

Run:
    cd stage_01_tokenizer
    python demo.py

What to notice
--------------
* Char-level has a tiny vocab but a long sequence.
* BPE has a larger vocab but a much shorter sequence.
* The ratio (chars per token) is what people quote when they say
  "GPT-4 averages ~4 chars per token on English". You'll see a
  smaller ratio here because we trained on very little text.
"""

from char_tokenizer import CharTokenizer
from bpe_tokenizer import BPETokenizer


SAMPLE = (
    "To be, or not to be, that is the question:\n"
    "Whether 'tis nobler in the mind to suffer\n"
    "The slings and arrows of outrageous fortune,\n"
    "Or to take arms against a sea of troubles\n"
    "And by opposing end them.\n"
)


def main() -> None:
    print("=" * 60)
    print("CHARACTER-LEVEL TOKENIZER")
    print("=" * 60)
    char_tok = CharTokenizer(SAMPLE)
    char_ids = char_tok.encode(SAMPLE)
    print(f"vocab size:      {char_tok.vocab_size}")
    print(f"sequence length: {len(char_ids)}")
    print(f"chars per token: {len(SAMPLE) / len(char_ids):.2f}")
    print(f"first 30 ids:    {char_ids[:30]}")

    print()
    print("=" * 60)
    print("BPE TOKENIZER (100 merges)")
    print("=" * 60)
    bpe_tok = BPETokenizer()
    bpe_tok.train(SAMPLE, num_merges=100)
    bpe_ids = bpe_tok.encode(SAMPLE)
    pieces = [bpe_tok.inv_vocab[i] for i in bpe_ids]
    print(f"vocab size:      {len(bpe_tok.vocab)}")
    print(f"sequence length: {len(bpe_ids)}")
    print(f"chars per token: {len(SAMPLE) / len(bpe_ids):.2f}")
    print(f"first 15 ids:    {bpe_ids[:15]}")
    print(f"first 15 pieces: {pieces[:15]}")

    print()
    print("=" * 60)
    print("KEY TRADE-OFF")
    print("=" * 60)
    print(
        f"char-level:  vocab={char_tok.vocab_size:>4}  seq_len={len(char_ids):>4}"
    )
    print(
        f"BPE:         vocab={len(bpe_tok.vocab):>4}  seq_len={len(bpe_ids):>4}"
    )
    print()
    print("BPE buys shorter sequences with a larger vocabulary.")
    print("That matters because attention is O(seq_len^2) — halving the")
    print("sequence length quarters the attention compute.")


if __name__ == "__main__":
    main()
