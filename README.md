# BolViva — Hinglish Voice Mock Viva 🎤

**Bolke seekho, bina dare.**

Tier-2/3 ke students ko concepts aate hain, lekin viva/interview me English me bolne me woh atak jaate hain. BolViva me student apna jawab **Hinglish me bolta** hai — app usko samajhta hai, model answer se compare karke **score** deta hai, aur sahi answer **Hinglish voice me sunata** hai.

Entry for **Gnani AI — Great Indian AI Internship Challenge** (deadline 10 Nov 2026).
Target categories: Best Hinglish code-mixed voice experience • Best Tier-2/3 town entry • Best 60-sec demo video.

## Flow

1. Subject choose karo — **OS / DBMS / Computer Networks / DSA** (3 sawal each)
2. App sawal sunata hai (voice)
3. Student bolke (mic) ya type karke Hinglish me jawab deta hai
4. Score card: **Concept 40 + Completeness 30 + Example/Clarity 20 + Confidence 10 = 100**, kya sahi tha / kya miss hua, aur Hinglish feedback
5. Teen sawal ke baad full viva report

## Tech

- **Next.js 14 (App Router) + React 18 + Tailwind CSS 3 + TypeScript**
- Question bank: `lib/questions.ts` (12 sawal, model answers + key terms)
- Scoring engine: `lib/scoring.ts` (pure logic, koi API nahi chahiye)
- Gnani models (integration points ready):
  - **Prisma v2.5 STT** — Hinglish speech → text → `app/api/stt/route.ts`
  - **Timbre v2.5 TTS** — sawal/feedback ki voice → `app/api/tts/route.ts`

## Setup

```bash
# 1. Dependencies install karo (ek baar)
npm install

# 2. Env file banao
cp .env.example .env.local
# .env.local me GNANI_API_KEY dalna hai — jab Gnani access mil jaye.
# Key kabhi chat / git / public jagah mat dalna.

# 3. Dev server
npm run dev
# http://localhost:3000
```

## Mock mode (bina API key ke)

App bina Gnani key ke **pura chalta hai** taaki build/demo kabhi ruke nahi:

| Feature | Mock mode me | Real mode me (key ke baad) |
|---|---|---|
| Sawal sunna | Browser `speechSynthesis` (hi-IN) | Gnani Timbre TTS (`/api/tts`) |
| Jawab bolna | MediaRecorder se recording save hoti hai, playback milta hai | Wahi audio `/api/stt` → Prisma STT → auto transcript |
| Jawab ka transcript | Student type karta hai (textarea) | STT transcript auto-fill |
| Scoring + feedback | `lib/scoring.ts` — pura real logic | Same (koi change nahi) |
| "Sahi answer suno" | Browser `speechSynthesis` | `/api/tts` se Timbre audio |

`/api/stt` aur `/api/tts` dono routes key na hone par saaf JSON return karte hain:
`{ "mock": true, "message": "GNANI_API_KEY not configured" }` — koi fake data invent nahi hota.

## Gnani API plug-in checklist (access milte hi)

1. `.env.local` me `GNANI_API_KEY` set karo
2. Gnani docs/dashboard se official **Prisma STT** endpoint confirm karke `GNANI_STT_ENDPOINT` set karo, phir `app/api/stt/route.ts` ke `TODO(Gnani STT)` block me real fetch call likho (audio format/sample-rate docs ke hisaab se)
3. Same **Timbre TTS** ke liye: `GNANI_TTS_ENDPOINT` + `app/api/tts/route.ts` ka `TODO(Gnani TTS)` block
4. Credits bachane ke liye: model answers ke TTS audio ek baar bana ke cache karo
5. Demo se pehle 4–5 asli Hinglish answers par STT accuracy test karo

## Project structure

```
app/
  page.tsx          — pura viva flow (subject → sawal → score → report)
  layout.tsx, globals.css
  api/stt/route.ts  — Prisma STT plug-in point (mock-safe)
  api/tts/route.ts  — Timbre TTS plug-in point (mock-safe)
lib/
  questions.ts      — 12-question bank + model answers + key terms
  scoring.ts        — rubric-based scoring engine + Hinglish feedback
```
