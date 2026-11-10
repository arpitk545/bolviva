import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// POST /api/stt — audio (FormData field: "audio") → transcript
//
// REAL MODE: GNANI_API_KEY set ho toh Gnani Prisma STT (POST /stt/v3,
// multipart: audio_file + language_code + format) ko call karke asli
// transcript return karte hain { mock: false, transcript }.
// Key na ho, API fail ho, ya transcript khaali ho toh { mock: true } —
// UI typed-text fallback par chalti hai. Koi fake transcript invent
// nahi kiya jata.
// Docs: gnani-vachana SDK (api.vachana.ai), header X-API-Key-ID.
// Supported audio: wav, mp3, flac, ogg, m4a, aac (webm nahi — isliye
// client ogg/mp4 me record karne ki koshish karta hai, page.tsx dekho).
// ---------------------------------------------------------------------------

const GNANI_STT_ENDPOINT =
  process.env.GNANI_STT_ENDPOINT ?? "https://api.vachana.ai/stt/v3";

function extFromType(t: string): string {
  if (t.includes("ogg")) return "ogg";
  if (t.includes("mp4") || t.includes("m4a") || t.includes("aac")) return "m4a";
  if (t.includes("mpeg") || t.includes("mp3")) return "mp3";
  if (t.includes("wav")) return "wav";
  if (t.includes("flac")) return "flac";
  return "webm"; // Gnani support nahi karta — error par UI typed fallback legi
}

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

  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!audio || typeof audio === "string") {
    return NextResponse.json(
      { mock: true, message: "No audio field in request", transcript: "" },
      { status: 400 }
    );
  }

  const blob = audio as Blob;
  const ext = extFromType(blob.type || "");

  try {
    const fd = new FormData();
    fd.append("audio_file", blob, `answer.${ext}`);
    fd.append("language_code", "hi-IN");
    fd.append("format", "verbatim");

    const res = await fetch(GNANI_STT_ENDPOINT, {
      method: "POST",
      headers: { "X-API-Key-ID": apiKey },
      body: fd,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        {
          mock: true,
          message: `Gnani STT error ${res.status}: ${errText.slice(0, 200)}`,
          transcript: "",
          language: "hi-en",
        },
        { status: 200 }
      );
    }

    const data: any = await res.json().catch(() => null);
    const transcript: string = (
      data?.transcript ??
      data?.text ??
      data?.result?.transcript ??
      ""
    )
      .toString()
      .trim();

    if (!transcript) {
      return NextResponse.json(
        {
          mock: true,
          message: "Gnani STT returned empty transcript",
          transcript: "",
          language: "hi-en",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { mock: false, transcript, language: "hi-en" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        mock: true,
        message: "Gnani STT fetch failed",
        transcript: "",
        language: "hi-en",
      },
      { status: 200 }
    );
  }
}
