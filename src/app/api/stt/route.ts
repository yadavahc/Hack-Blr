import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) || "en";

    if (!audio) return NextResponse.json({ error: "No audio provided" }, { status: 400 });

    const { sarvamSTT, isSarvamConfigured } = await import("@/lib/sarvam");
    if (!isSarvamConfigured()) {
      return NextResponse.json({ error: "Sarvam not configured" }, { status: 503 });
    }

    const transcript = await sarvamSTT(audio, language);
    return NextResponse.json({ transcript });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("STT error:", msg);
    return NextResponse.json({ error: `STT failed: ${msg}` }, { status: 500 });
  }
}
