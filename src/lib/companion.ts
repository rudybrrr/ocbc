import { respond, type AssistContext } from "@/lib/assistant";
import { DESTINATIONS } from "@/lib/data";
import { sgd } from "@/lib/format";
import type { DestinationId } from "@/lib/types";

// kept short so the "user gets stuck" moment happens quickly during a live demo
export const STUCK_MS = 8000;

// screens where penny watches for a stalled user
export const STUCK_VIEWS = ["pay", "amount", "review"];

// screens that belong to the transfer flow, the guide ends when the user leaves them
export const FLOW_VIEWS = [...STUCK_VIEWS, "receipt"];

export type GuideTarget = "search" | "amount" | "next" | "confirm";

export type GuideStep = { target: GuideTarget | null; line: string };

export type CompanionResult =
  | { kind: "say"; text: string }
  | { kind: "guide" }
  | { kind: "pay"; to: DestinationId; amount: string }
  | { kind: "stop"; text: string };

// the step is worked out from what is on screen instead of a step counter,
// so going back or editing the amount can never leave the guide out of sync
export function guideStep(
  view: string,
  draft: { amountOk: boolean; amount: number; name: string },
): GuideStep {
  if (view === "pay")
    return {
      target: "search",
      line: "Find the person you want to pay. Search their name, or tap them in the list.",
    };
  if (view === "amount" && !draft.amountOk)
    return {
      target: "amount",
      line: `Type how much to send to ${draft.name}. For example, 10.`,
    };
  if (view === "amount")
    return {
      target: "next",
      line: `${sgd(draft.amount)} to ${draft.name}. If that looks right, tap Next.`,
    };
  if (view === "review")
    return {
      target: "confirm",
      line: "Check the amount and the name. Then tap Confirm practice payment.",
    };
  if (view === "receipt")
    return { target: null, line: "All done! Your payment is recorded. Nice work." };
  return { target: null, line: "" };
}

export function stuckLine(view: string) {
  if (view === "pay")
    return "Looking for someone to pay? I can walk you through it. Or just tell me, like “pay Mum 10”.";
  if (view === "amount")
    return "Not sure what to do here? I can help you finish this payment.";
  return "Ready to send? I can check this with you before you confirm.";
}

export function issueLine(issue: string) {
  return `That did not go through. ${issue}`;
}

// extra spoken names so "pay my mom" still finds the right contact
const ALIASES: Partial<Record<DestinationId, string[]>> = {
  mum: ["mom", "mother", "mummy", "mama", "ma"],
  fairprice: ["ntuc"],
};

function words(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9.\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function findContact(text: string) {
  const said = new Set(words(text));
  return DESTINATIONS.find(
    (item) =>
      item.detail === "PayNow" &&
      [...words(item.name), ...(ALIASES[item.id] ?? [])].some(
        (word) => word.length >= 2 && said.has(word),
      ),
  );
}

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

// voice input can arrive as "ten dollars" instead of "10", so small number words are read too
function wordNumber(text: string) {
  let total = 0;
  let found = false;
  for (const word of words(text)) {
    if (ONES.includes(word)) total += ONES.indexOf(word);
    else if (TENS.includes(word)) total += TENS.indexOf(word) * 10;
    else if (word === "hundred") total = Math.max(total, 1) * 100;
    else continue;
    found = true;
  }
  return found && total > 0 ? String(total) : "";
}

export function findAmount(text: string) {
  const digits = text.replace(/,/g, "").match(/\d+(?:\.\d{1,2})?/);
  return digits ? digits[0] : wordNumber(text);
}

// rule based "understanding": each regex is one intent, checked from most to least specific
export function companionReply(
  input: string,
  ctx: { issue: string; guiding: boolean; assist: AssistContext },
): CompanionResult {
  const text = input.toLowerCase();

  if (/\b(stop|cancel|never ?mind|no thanks|not now)\b/.test(text))
    return { kind: "stop", text: "No problem. I am here if you need me." };

  const contact = findContact(text);
  if (contact) return { kind: "pay", to: contact.id, amount: findAmount(text) };

  if (ctx.issue && /why|error|wrong|blocked|declined|problem|can.?t|cannot|fail/.test(text))
    return { kind: "say", text: issueLine(ctx.issue) };

  if (/\b(help|how|stuck|guide|show me|walk|what now|next|what do i|send|pay|transfer|yes|ok|okay|sure)\b/.test(text))
    return { kind: "guide" };

  return { kind: "say", text: respond(input, ctx.assist).text };
}
