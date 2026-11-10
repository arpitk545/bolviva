import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// POST /api/tts — JSON { text: string } → synthesized audio
//
// REAL MODE: GNANI_API_KEY set ho toh Gnani Timbre v2.5 ko call karke
// audio ko data URL me return karte hain { mock: false, audioUrl }.
// Key na ho ya API fail ho toh { mock: true } — UI browser speechSynthesis
// par gir jati hai (page.tsx).
// Docs: gnani-vachana SDK (api.vachana.ai), header X-API-Key-ID.
// ---------------------------------------------------------------------------

const GNANI_TTS_ENDPOINT =
  process.env.GNANI_TTS_ENDPOINT ?? "https://api.vachana.ai/api/v1/tts/inference";

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
      { mock: true, message: "GNANI_API_KEY not configured", audioUrl: null, text },
      { status: 200 }
    );
  }

  try {
    const res = await fetch(GNANI_TTS_ENDPOINT, {
      method: "POST",
      headers: {
        "X-API-Key-ID": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model: "timbre-v2.5",
        voice: "Nalini",
        language: "hi-IN",
        speed: 1.0,
        audio_config: {
          sample_rate: 48000,
          encoding: "linear_pcm",
          num_channels: 1,
          sample_width: 2,
          container: "mp3",
          bitrate: "128k",
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        {
          mock: true,
          message: `Gnani TTS error ${res.status}: ${errText.slice(0, 200)}`,
          audioUrl: null,
          text,
        },
        { status: 200 }
      );
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const audioUrl = `data:audio/mpeg;base64,${buf.toString("base64")}`;
    return NextResponse.json({ mock: false, audioUrl, text }, { status: 200 });
  } catch {
    return NextResponse.json(
      { mock: true, message: "Gnani TTS fetch failed", audioUrl: null, text },
      { status: 200 }
    );
  }
}
