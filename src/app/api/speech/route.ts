const headers = { "Cache-Control": "no-store" };

// Expose availability only. Provider credentials and model configuration stay server-side.
export function GET() {
  return Response.json({ enabled: Boolean(process.env.ELEVENLABS_API_KEY?.trim()) }, { headers });
}

export async function POST(request: Request) {
  let text: string;
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || !("text" in body) || typeof body.text !== "string" || !body.text.trim() || body.text.length > 1000) {
      return Response.json({ error: "Enter 1–1000 characters to read aloud." }, { status: 400, headers });
    }
    text = body.text.trim();
  } catch {
    return Response.json({ error: "Invalid JSON request." }, { status: 400, headers });
  }

  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) return Response.json({ error: "Voice is not configured." }, { status: 503, headers });
  const voice = process.env.ELEVENLABS_VOICE_ID?.trim() || "JBFqnCBsd6RMkjVDRZzb";
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(12000)]);
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_multilingual_v2" }),
      signal,
      cache: "no-store",
    });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("audio/")) {
      return Response.json({ error: "Voice is unavailable. Please try again." }, { status: 502, headers });
    }
    const audio = await response.arrayBuffer();
    if (!audio.byteLength) throw new Error("Empty audio");
    return new Response(audio, { headers: { ...headers, "Content-Type": "audio/mpeg" } });
  } catch {
    return Response.json({ error: "Voice is unavailable. Please try again." }, { status: signal.aborted ? 504 : 502, headers });
  }
}
