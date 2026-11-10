import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// POST /api/tts — JSON { text: string } → synthesized audio
//
// MOCK MODE: GNANI_API_KEY na ho toh { mock: true, ... } return hota hai aur
// UI browser ki speechSynthesis se feedback sunati hai (page.tsx dekho).
// Model answers ke TTS audio ko ek baar bana ke cache karne ka plan hai
// (credits bachane ke liye) — woh integration ke time yahin aayega.
// ---------------------------------------------------------------------------

// TODO(Gnani): Official Timbre v2.5 TTS REST endpoint yahan dalna hai.
// Endpoint URL invent NAHI kiya gaya hai — Gnani dashboard / API docs se
// confirm karke GNANI_TTS_ENDPOINT env me set karna.
const GNANI_TTS_ENDPOINT = process.env.GNANI_TTS_ENDPOINT ?? "";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GNANI_API_KEY;

  const body = await req.json().catch(() => null);
  const text: string = typeof body?.text === "string" ? body.text : "";
  if (!text) {
    return NextResponse.json(
      { mock: true, message: "Missing 'text' in request body", audioUrl: null },
      { status: 400 }
    );
  }

  if (!apiKey) {
    return NextResponse.json(
      {
        mock: true,
        message: "GNANI_API_KEY not configured",
        audioUrl: null,
        text,
      },
      { status: 200 }
    );
  }

  // TODO(Gnani TTS): Yahan real Timbre v2.5 TTS call aayegi:
  //   1. fetch(GNANI_TTS_ENDPOINT, { method: "POST",
  //        headers: { Authorization: `Bearer ${apiKey}`,
  //                   "Content-Type": "application/json" },
  //        body: JSON.stringify({ text, /* voice/language docs se */ }) })
  //   2. Audio response ko ya toh direct stream karna, ya ek short-lived
  //      URL bana ke { mock: false, audioUrl } return karna.
  // Tab tak key hone par bhi honest mock response:
  void GNANI_TTS_ENDPOINT;
  return NextResponse.json(
    {
      mock: true,
      message: "Gnani TTS integration pending — see TODO in app/api/tts/route.ts",
      audioUrl: null,
      text,
    },
    { status: 200 }
  );
}
