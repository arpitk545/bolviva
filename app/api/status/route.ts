import { NextResponse } from "next/server";

// GET /api/status — UI ko batata hai ki Gnani key configured hai ya nahi
// (sirf boolean; key kabhi expose nahi hoti).
export async function GET() {
  return NextResponse.json({ gnani: Boolean(process.env.GNANI_API_KEY) });
}
