import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// POST /api/stt — audio (FormData field: "audio") → transcript
//
// MOCK MODE: jab tak GNANI_API_KEY configure nahi hoti, ye route hamesha
// { mock: true, ... } return karta hai aur UI typed-text fallback par chalti
// hai. Koi fake transcript invent nahi kiya jata.
// ---------------------------------------------------------------------------

// TODO(Gnani): Official Prisma v2.5 STT REST endpoint yahan dalna hai.
// Endpoint URL invent NAHI kiya gaya hai — Gnani dashboard / API docs se
// confirm karke GNANI_STT_ENDPOINT env me set karna, ya neeche ki constant me.
const GNANI_STT_ENDPOINT = process.env.GNANI_STT_ENDPOINT ?? "";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GNANI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        mock: true,
        message: "GNANI_API_KEY not configured",
        transcript: "",
        language: "hi-en", // Hinglish code-mixed
      },
      { status: 200 }
    );
  }

  // Form parse karke rakh liya hai taaki real integration seedha plug ho.
  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!audio) {
    return NextResponse.json(
      { mock: true, message: "No audio field in request", transcript: "" },
      { status: 400 }
    );
  }

  // TODO(Gnani STT): Yahan real Prisma v2.5 STT call aayegi:
  //   1. `audio` Blob ko Gnani ke required format me bhejna
  //      (format/sample-rate docs se confirm karna — webm ko conversion
  //      chahiye ho toh server-side ffmpeg step yahin lagega).
  //   2. fetch(GNANI_STT_ENDPOINT, { method: "POST",
  //        headers: { Authorization: `Bearer ${apiKey}`, ... }, body })
  //   3. Response se transcript nikalke return karna:
  //      { mock: false, transcript, language: "hi-en" }
  // Tab tak key hone par bhi honest mock response:
  void GNANI_STT_ENDPOINT;
  return NextResponse.json(
    {
      mock: true,
      message: "Gnani STT integration pending — see TODO in app/api/stt/route.ts",
      transcript: "",
      language: "hi-en",
    },
    { status: 200 }
  );
}
