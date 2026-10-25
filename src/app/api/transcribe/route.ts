import { DESTINATIONS } from "@/lib/data";

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

// a few seconds of speech is well under 1 MB, this cap just stops oversized uploads
const MAX_BYTES = 5 * 1024 * 1024;

// whisper uses the prompt as context, so listing the contact names makes it far more
// likely to spell "Jamie Lim" or "FairPrice" correctly instead of guessing
const PROMPT = `A bank customer asks for help with a transfer, for example: Pay Mum 10 dollars. Send 20 dollars to Alex Tan. Contacts: ${DESTINATIONS.filter(
  (item) => item.detail === "PayNow",
)
  .map((item) => item.name.replace(" · ", " "))
  .join(", ")}.`;

// this runs on the server, so the groq key is never sent to the browser
export async function POST(request: Request) {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) {
    return Response.json({ error: "Voice input is not configured. You can type instead." }, { status: 503 });
  }

  let form: FormData;
  try { form = await request.formData(); }
  catch { return Response.json({ error: "Invalid recording." }, { status: 400 }); }
  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return Response.json({ error: "No audio received" }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return Response.json({ error: "Recording is too long" }, { status: 413 });
  }

  const body = new FormData();
  body.append("file", audio, audio.name || "speech.webm");
  body.append("model", process.env.GROQ_TRANSCRIPTION_MODEL?.trim() || "whisper-large-v3-turbo");
  body.append("language", "en");
  body.append("prompt", PROMPT);
  body.append("response_format", "json");

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(12000)]);
  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body,
      signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Transcription failed");
    const data: unknown = await response.json();
    if (typeof data !== "object" || data === null || !("text" in data) || typeof data.text !== "string" || !data.text.trim() || data.text.length > 2000) throw new Error("Invalid transcript");
    return Response.json({ text: data.text.trim() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Could not transcribe. Please try again or type instead." }, { status: signal.aborted ? 504 : 502 });
  }
}
