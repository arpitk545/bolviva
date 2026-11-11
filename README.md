# BolViva — Voice Mock Viva, powered by Gnani AI 🎤

**Practice speaking your answers before the real viva does it for you.**

Students in tier-2/3 towns usually *know* their concepts — they freeze when they
have to say them out loud in English. BolViva is a voice-first mock viva: the
app asks a question out loud, the student answers by speaking (English or
Hinglish), Gnani's speech models listen, and the student gets a scored report
with spoken feedback — just like a real examiner, minus the fear.

Entry for **Gnani AI — Great Indian AI Internship Challenge**
(deadline extended to 15 Nov 2026).
Target categories: Best Hinglish code-mixed voice experience • Best Tier-2/3
town entry • Best demo video.

**Live app:** https://bolviva.vercel.app

## The voice loop — Gnani end to end

Every spoken moment in BolViva runs on Gnani's Vachana platform
(`api.vachana.ai`, single `GNANI_API_KEY`, header `X-API-Key-ID`):

| Step | What happens | Gnani model |
|---|---|---|
| 1 | The question is read aloud to the student | **Timbre v2.5 TTS** (voice: Nalini, en-IN) |
| 2 | The student answers by speaking into the mic | — |
| 3 | The spoken answer is transcribed (code-mixed English stays in Latin script, so scoring matches cleanly) | **Prisma v3.0 STT** (`indic-auto`, `codemix`) |
| 4 | The answer is scored and feedback is generated | BolViva scoring engine (below) |
| 5 | Feedback, the model answer, and the final report summary are spoken back | **Timbre v2.5 TTS** |

Subjects: **Operating Systems / DBMS / Computer Networks / DSA** —
3 questions per viva, 40-question bank.

## Scoring — an examiner's answer key, matched fairly

A real examiner grades against a fixed answer key; BolViva does the same.
The 40-question bank (`lib/questions.ts`) carries model-answer points and key
concepts per question, and `lib/scoring.ts` grades the Prisma transcript
against them on the challenge rubric:

- **Concept accuracy — 40** · **Completeness — 30** · **Example/Clarity — 20** · **Confidence — 10**

Matching is deliberately *not* naive string search, because students answer
in their own words and STT is not perfect:

1. **Morphological word forms** — "processes / executing / sharing" count for
   "process / execution / share".
2. **Fuzzy near-match** (edit distance) for longer words — small STT
   mis-hearings or spelling variants still earn the point.
3. **Phrase fallback** — a multi-word key concept counts when ≥70% of its
   content words are present, in English or Hinglish variants.

Verified effect: a correct paraphrased answer scores **84/100** (vs 71 with
plain exact matching), an STT-noised transcript **82** (vs 63) — while a weak
answer still scores 25 and an off-topic one 7. No free marks.

## Honest fallback (no fake "live")

If the Gnani key is missing or an API call fails, the API routes return
`{ "mock": true }`, the UI shows a clear mock-mode warning and falls back to
the browser's built-in voice, and typed answers remain available. BolViva
never presents mock output as Gnani output.

## Tech

- **Next.js 14 (App Router) + React 18 + Tailwind CSS 3 + TypeScript**
- `app/api/tts/route.ts` — Timbre v2.5 synthesis (`/api/v1/tts/inference`)
- `app/api/stt/route.ts` — Prisma v3.0 transcription (`/stt/v3`)
- `app/api/status/route.ts` — reports only whether the key is live (boolean; the key itself is never exposed)
- `lib/questions.ts` — 40 questions with model answers + key terms
- `lib/scoring.ts` — rubric scoring engine (pure logic, no extra API needed)

## Setup

```bash
npm install
cp .env.example .env.local   # set GNANI_API_KEY (never commit or share the key)
npm run dev                  # http://localhost:3000
```

## Project structure

```
app/
  page.tsx          — full viva flow (subject → question → score → report)
  layout.tsx, globals.css
  api/stt/route.ts  — Gnani Prisma v3.0 STT (mock-safe fallback)
  api/tts/route.ts  — Gnani Timbre v2.5 TTS (mock-safe fallback)
  api/status/route.ts
lib/
  questions.ts      — 40-question bank + model answers + key terms
  scoring.ts        — rubric-based scoring engine + feedback
```
