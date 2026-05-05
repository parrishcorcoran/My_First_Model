"""
FastAPI backend for the LLM-from-scratch course.

Each course stage exposes its Python implementation through HTTP endpoints
so the Next.js frontend can call the *actual* code we wrote, not a re-port.
That way the website is a live demo of the same code students study.

Run locally:
    cd api
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

Deploy: Railway (see railway.toml in the repo root).
"""

from __future__ import annotations

import sys
from pathlib import Path

# Make the project root importable so we can `from model.stage_01_tokenizer...`
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from model.stage_01_tokenizer.bpe_tokenizer import BPETokenizer
from model.stage_01_tokenizer.char_tokenizer import CharTokenizer

app = FastAPI(title="LLM From Scratch — Course API", version="0.1.0")

# Allow the frontend to call us. In production we'd lock this to the
# Vercel domain; for now we accept all origins because preview deployments
# get random subdomains.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Stage 1: tokenizers
# ---------------------------------------------------------------------------


class CharTokenizeRequest(BaseModel):
    corpus: str = Field(..., description="Text used to build the vocab.")
    text: str = Field(..., description="Text to tokenize.")


class TokenPiece(BaseModel):
    id: int
    piece: str


class CharTokenizeResponse(BaseModel):
    vocab_size: int
    tokens: list[TokenPiece]
    chars_per_token: float


@app.post("/api/stage1/char", response_model=CharTokenizeResponse)
def char_tokenize(req: CharTokenizeRequest) -> CharTokenizeResponse:
    if not req.corpus:
        raise HTTPException(400, "corpus must be non-empty")
    tok = CharTokenizer(req.corpus)
    try:
        ids = tok.encode(req.text)
    except KeyError as e:
        raise HTTPException(
            400,
            f"character {e.args[0]!r} not in training corpus — "
            "char-level tokenizers can't handle unseen characters. "
            "This is the OOV problem.",
        )
    pieces = [TokenPiece(id=i, piece=tok.itos[i]) for i in ids]
    return CharTokenizeResponse(
        vocab_size=tok.vocab_size,
        tokens=pieces,
        chars_per_token=len(req.text) / max(len(ids), 1),
    )


class BPETokenizeRequest(BaseModel):
    corpus: str = Field(..., description="Training corpus for BPE merges.")
    text: str = Field(..., description="Text to tokenize after training.")
    num_merges: int = Field(50, ge=0, le=2000)


class BPEMerge(BaseModel):
    a: str
    b: str
    merged: str


class BPETokenizeResponse(BaseModel):
    vocab_size: int
    merges: list[BPEMerge]
    tokens: list[TokenPiece]
    chars_per_token: float


@app.post("/api/stage1/bpe", response_model=BPETokenizeResponse)
def bpe_tokenize(req: BPETokenizeRequest) -> BPETokenizeResponse:
    if not req.corpus:
        raise HTTPException(400, "corpus must be non-empty")
    tok = BPETokenizer()
    tok.train(req.corpus, num_merges=req.num_merges)
    try:
        ids = tok.encode(req.text)
    except KeyError as e:
        raise HTTPException(
            400,
            f"{e.args[0]} — try a longer corpus that contains all the "
            "characters in your test text, or switch to byte-level BPE.",
        )
    pieces = [TokenPiece(id=i, piece=tok.inv_vocab[i]) for i in ids]
    merges = [BPEMerge(a=a, b=b, merged=a + b) for a, b in tok.merges]
    return BPETokenizeResponse(
        vocab_size=len(tok.vocab),
        merges=merges,
        tokens=pieces,
        chars_per_token=len(req.text) / max(len(ids), 1),
    )
