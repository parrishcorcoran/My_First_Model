export type StageStatus = "live" | "drafting" | "planned";

export type Stage = {
  num: number;
  slug: string;
  title: string;
  status: StageStatus;
  intuition: string;
  learningGoals: string[];
};

export const STAGES: Stage[] = [
  {
    num: 1,
    slug: "tokenizer",
    title: "Tokenization",
    status: "live",
    intuition:
      "Models eat numbers, not text. A tokenizer maps strings to integer ids and back. The choice — char, word, or subword — affects vocab size, sequence length, and the entire model's compute budget.",
    learningGoals: [
      "Implement a character-level tokenizer (encode/decode, vocab building)",
      "Implement Byte-Pair Encoding (BPE) from scratch — the algorithm GPT-2/3/4 use",
      "Reason about the tradeoff between vocab size and sequence length",
      "Explain why byte-level BPE eliminates OOV",
    ],
  },
  {
    num: 2,
    slug: "embeddings",
    title: "Embeddings & Positional Encoding",
    status: "planned",
    intuition:
      "Token ids carry no meaning on their own. Embeddings turn each id into a learned vector. Positional encodings add 'where in the sequence' information, since attention is permutation-invariant.",
    learningGoals: [
      "Build a token embedding layer as a lookup table",
      "Compare learned positional embeddings, sinusoidal, and RoPE",
      "Understand why positional info is needed at all",
    ],
  },
  {
    num: 3,
    slug: "attention",
    title: "Self-Attention from Scratch",
    status: "planned",
    intuition:
      "Every output token is a weighted average of value vectors, where the weights come from a query-key compatibility score. Causal masking is what makes it a language model rather than a bidirectional encoder.",
    learningGoals: [
      "Derive scaled dot-product attention from first principles",
      "Implement single-head attention with manual matmuls",
      "Apply a causal mask and explain why scaling by sqrt(d_k) matters",
    ],
  },
  {
    num: 4,
    slug: "multi-head",
    title: "Multi-Head Attention",
    status: "planned",
    intuition:
      "Splitting attention across heads lets the model attend to different patterns in parallel — syntax in one head, coreference in another. Mathematically: same op, run in parallel on slices of the embedding.",
    learningGoals: [
      "Implement multi-head attention by reshaping",
      "Reason about head_dim vs num_heads tradeoffs",
      "Understand how Grouped-Query Attention (GQA) saves memory",
    ],
  },
  {
    num: 5,
    slug: "transformer-block",
    title: "The Transformer Block",
    status: "planned",
    intuition:
      "Attention + MLP, wrapped in residual connections and LayerNorm. Pre-norm vs post-norm is one of the most important architectural choices nobody talks about.",
    learningGoals: [
      "Compose attention + MLP + residual + LayerNorm",
      "Explain why pre-norm trains more stably than post-norm",
      "Understand residuals as additive feature pathways",
    ],
  },
  {
    num: 6,
    slug: "gpt-model",
    title: "Full GPT Model",
    status: "planned",
    intuition:
      "Stack N transformer blocks, tie input/output embeddings, project to vocab. Now you have a language model. Counting parameters and FLOPs at this stage is what separates 'can use a model' from 'understands a model'.",
    learningGoals: [
      "Assemble the full model end-to-end",
      "Compute parameter count and FLOPs by hand",
      "Explain weight tying and why it works",
    ],
  },
  {
    num: 7,
    slug: "training",
    title: "Training Loop",
    status: "planned",
    intuition:
      "Cross-entropy loss between predicted next-token distribution and the actual next token, summed over the sequence. AdamW optimizes. LR schedule matters more than people expect.",
    learningGoals: [
      "Implement next-token prediction with cross-entropy loss",
      "Understand AdamW, weight decay, gradient clipping",
      "Build a warmup + cosine LR schedule and explain why",
    ],
  },
  {
    num: 8,
    slug: "sampling",
    title: "Sampling & Inference",
    status: "planned",
    intuition:
      "Once trained, the model gives a probability distribution over the next token. How you sample from it determines whether you get robotic, repetitive output (greedy) or creative, sometimes-incoherent output (high temp).",
    learningGoals: [
      "Implement greedy, temperature, top-k, and top-p sampling",
      "Build intuition for each via interactive experiments",
      "Understand KV caching for efficient generation",
    ],
  },
  {
    num: 9,
    slug: "chat",
    title: "Chat Wrapper",
    status: "planned",
    intuition:
      "A chat model is a base LM with a chat template — special tokens that mark user/assistant turns. We wrap our model in a REPL that handles the formatting.",
    learningGoals: [
      "Define a chat template with system/user/assistant tokens",
      "Build a streaming REPL",
      "Explain why chat models need post-training (next stage)",
    ],
  },
  {
    num: 10,
    slug: "fine-tuning",
    title: "Supervised Fine-Tuning (SFT)",
    status: "planned",
    intuition:
      "A base LM completes text. SFT teaches it to follow instructions by training on (instruction, response) pairs. Loss is masked so we only learn from the response side.",
    learningGoals: [
      "Format an instruction dataset",
      "Implement loss masking",
      "Compare base-model outputs to SFT'd outputs on the same prompt",
    ],
  },
];
