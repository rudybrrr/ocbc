import { routeIntent } from "@/lib/intent-server";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || !("text" in body) || typeof body.text !== "string" || !body.text.trim() || body.text.length > 500) {
      return Response.json({ error: "Enter a request of 1–500 characters." }, { status: 400 });
    }
    return Response.json(await routeIntent(body.text.trim()));
  } catch {
    return Response.json({ error: "Invalid JSON request." }, { status: 400 });
  }
}
