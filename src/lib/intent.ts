import { DESTINATIONS } from "@/lib/data";
import { findAmount, findContact } from "@/lib/companion";
import { isJourney, type Intent, type Journey } from "@/lib/journeys";

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateIntent(value: unknown): Intent | null {
  if (!object(value) || Object.keys(value).some((key) => !["journey", "confidence", "slots", "clarify_question", "options"].includes(key))) return null;
  if (!isJourney(value.journey) || typeof value.confidence !== "number" || !Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1) return null;
  const slots = value.slots;
  if (!object(slots) || Object.keys(slots).some((key) => !["amount", "recipient"].includes(key))) return null;
  if (slots.amount !== undefined && (typeof slots.amount !== "number" || !Number.isFinite(slots.amount) || slots.amount <= 0)) return null;
  if (slots.recipient !== undefined && (typeof slots.recipient !== "string" || !slots.recipient.trim() || slots.recipient.length > 100)) return null;
  if (value.clarify_question !== undefined && (typeof value.clarify_question !== "string" || !value.clarify_question.trim() || value.clarify_question.length > 240)) return null;
  if (value.options !== undefined && (!Array.isArray(value.options) || value.options.length < 1 || value.options.length > 3 || !value.options.every(isJourney))) return null;
  if ((value.confidence < 0.75 || value.journey === "unclear") && (!value.clarify_question || !value.options)) return null;
  return value as Intent;
}

function contactName(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim().replace(/^my /, "");
}

export function findIntentContact(recipient: string) {
  const name = contactName(recipient);
  const exact = DESTINATIONS.find((contact) => contact.detail === "PayNow" && contactName(contact.name) === name);
  if (exact) return exact;
  // A single spoken first name or alias uses the existing matcher; extra names must match exactly.
  return name && !name.includes(" ") ? findContact(name) : undefined;
}

export function fallbackIntent(input: string): Intent {
  const text = input.toLowerCase().replace(/\b(transfr|tranfer|trasnfer)\b/g, "transfer").replace(/\b(pay now|paynwo)\b/g, "paynow").replace(/\b(inves[tm]ent|investng)\b/g, "investing");
  const slots: Intent["slots"] = {};
  let journey: Journey = "unclear";
  if (/\b(stock|stocks|tesla|bitcoin|crypto|buy shares|sell shares|recommend|investment advice|weather|recipe|lottery)\b/.test(text)) journey = "out_of_scope";
  else if (/\b(person|human|banker|agent|someone|customer service)\b/.test(text)) journey = "talk_to_person";
  else if (/\b(scan|qr)\b/.test(text)) journey = "scan_and_pay";
  else if (/\b(foreign|exchange|forex|currency|convert|fx|usd|ringgit)\b/.test(text)) journey = "foreign_exchange";
  else if (/\b(fixed|time|term)\s*(deposit|depoist)s?\b|\bfd\b/.test(text)) journey = "fixed_deposit";
  else if (/\b(invest|investing|unit trusts?|funds?)\b/.test(text)) journey = "start_investing";
  else if (/\b(transaction|transactions|history|activity|statement|spent|spending)\b/.test(text)) journey = "view_transactions";
  else if (/\b(offer|offers|promo|promotions|deals|rewards|savings goal|money insights)\b/.test(text)) journey = "explore_offers";
  else if (/\bpaynow\b/.test(text)) journey = "paynow";
  else if (/\b(send|pay|transfer|move money)\b/.test(text)) journey = "transfer";

  if (["transfer", "paynow", "fixed_deposit"].includes(journey)) {
    const amount = Number(findAmount(text));
    if (Number.isFinite(amount) && amount > 0 && !/-\s*\d|\d+\.\d{3,}/.test(text)) slots.amount = amount;
  }
  if (journey === "transfer" || journey === "paynow") {
    const named = text.match(/\bto\s+(?:my\s+)?(.+?)(?:\s+(?:or not|please|lah|leh|can|for)\b|$)/)?.[1]?.trim().replace(/\s+\$?\d+(?:\.\d+)?(?:\s*dollars?)?$/, "");
    const contact = named ? findIntentContact(named) : DESTINATIONS.find((item) => item.detail === "PayNow" && contactName(text).includes(contactName(item.name))) ?? findContact(text);
    const recipient = contact?.name ?? named;
    if (recipient) slots.recipient = recipient.slice(0, 100);
    if (/\b(send|pay|transfer|paynow)\b/.test(text) && !slots.amount && slots.recipient) {
      return { journey, confidence: 0.65, slots, clarify_question: `How much would you like to send to ${slots.recipient}? You can type an amount, or open a payment to enter it.`, options: [journey, "talk_to_person"] };
    }
  }
  if (journey === "out_of_scope") return { journey, confidence: 1, slots: {}, options: ["start_investing", "talk_to_person"] };
  if (journey === "unclear") return { journey, confidence: 0, slots: {}, clarify_question: "What would you like to do?", options: ["transfer", "view_transactions", "talk_to_person"] };
  return { journey, confidence: 0.9, slots };
}

export async function requestIntent(text: string): Promise<Intent> {
  try {
    const response = await fetch("/api/intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }), signal: AbortSignal.timeout(4500) });
    if (!response.ok) throw new Error("Intent unavailable");
    const intent = validateIntent(await response.json());
    if (intent) return intent;
  } catch {
    // Local matching also covers an unavailable app server.
  }
  return fallbackIntent(text);
}
