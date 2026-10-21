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
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return Response.json({ error: "GROQ_API_KEY is not set" }, { status: 500 });
  }

  const form = await request.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return Response.json({ error: "No audio received" }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return Response.json({ error: "Recording is too long" }, { status: 413 });
  }

  const body = new FormData();
  body.append("file", audio, audio.name || "speech.webm");
  body.append("model", "whisper-large-v3-turbo");
  body.append("language", "en");
  body.append("prompt", PROMPT);
  body.append("response_format", "json");

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body,
  });
  if (!response.ok) {
    return Response.json({ error: "Transcription failed" }, { status: 502 });
  }

  const data = (await response.json()) as { text?: string };
  return Response.json({ text: (data.text ?? "").trim() });
}
