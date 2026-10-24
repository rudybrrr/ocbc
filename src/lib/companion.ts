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

export type JourneyGuide = { guided: boolean; step: number };
export type GuideTarget = "search" | "amount" | "next" | "confirm"
  | "invest-intro" | "invest-terms" | "invest-fees" | "invest-risks" | "invest-review" | "invest-confirm"
  | "fd-intro" | "fd-tenor" | "fd-withdrawal" | "fd-review" | "fd-confirm";

const JOURNEY_STEPS: Record<string, GuideStep[]> = {
  invest: [
    { target: "invest-intro", line: "Read what this process covers, then continue. Your place will be saved." },
    { target: "invest-terms", line: "Read the key terms. Continue when you are ready, or talk to a person." },
    { target: "invest-fees", line: "Check which fees a real application would disclose, then continue." },
    { target: "invest-risks", line: "Read the risks before continuing. Returns are not guaranteed." },
    { target: "invest-review", line: "Review the process. Continue opens a separate confirmation." },
    { target: "invest-confirm", line: "Confirm only if you want to mark the process as completed. No order is placed." },
  ],
  "fixed-deposit": [
    { target: "fd-intro", line: "Read how a fixed deposit works, then continue." },
    { target: "fd-tenor", line: "Enter your own amount and choose a tenor. No tenor is suggested." },
    { target: "fd-withdrawal", line: "Read the early-withdrawal effects and fees, then continue to review." },
    { target: "fd-review", line: "Check your amount, tenor and account before opening the confirmation." },
    { target: "fd-confirm", line: "Confirm only when the details are correct. This simulates an application; no money moves." },
  ],
};

export type GuideStep = { target: GuideTarget | null; line: string };

export type CompanionResult =
  | { kind: "say"; text: string }
  | { kind: "guide" }
  | { kind: "pay"; to: DestinationId; amount: string }
  | { kind: "fixed-deposit"; text: string }
  | { kind: "stop"; text: string }
  | { kind: "go"; view: string; text: string };

// copies the ‹ back buttons on each screen, so "go back" by voice lands where a tap would
const BACK: Record<string, string> = {
  amount: "pay",
  review: "amount",
  invest: "plan",
};

const SCREEN_NAMES: Record<string, string> = {
  home: "Home",
  pay: "PayNow",
  plan: "Plan your finances",
};

// the 4 voice navigation commands. home is checked before back,
// so "go back home" goes home instead of one screen back
const NAV: [RegExp, string][] = [
  [/\b(go|take me|back) (to )?home\b|\bhome (screen|page)\b|\bmain (screen|page)\b/, "home"],
  [/\b(go back|back|previous)\b/, "back"],
  [/\b(paynow|payments? (screen|page)|pay (and|&) transfer|transfer (screen|page))\b/, "pay"],
  [/\b(open|go to|show)( my| the)? plan\b|\bplan (screen|page)\b/, "plan"],
];

// the step is worked out from what is on screen instead of a step counter,
// so going back or editing the amount can never leave the guide out of sync
export function guideStep(
  view: string,
  draft: { amountOk: boolean; amount: number; name: string },
  journey?: JourneyGuide,
): GuideStep {
  if (view in JOURNEY_STEPS) {
    return journey?.guided ? JOURNEY_STEPS[view][journey.step] ?? { target: null, line: "" } : { target: null, line: "" };
  }
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

// shown when no rule matches, so the user is never left with silence or a wrong action.
// it suggests phrases that are known to work instead of just saying "error"
export const FALLBACK_LINE =
  "Sorry, I didn't catch that. Try “help me pay”, “pay Mum 10”, or tap “Yes, guide me”.";

// short enough for the small bubble penny shows while she peeks from the corner
export function peekLine(view: string) {
  if (view === "pay") return "Need a hand finding someone?";
  if (view === "amount") return "Stuck on the amount? I can help.";
  return "Almost there! Want me to check it with you?";
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
  const said = words(text);
  return DESTINATIONS.find(
    (item) =>
      item.detail === "PayNow" &&
      [...words(item.name), ...(ALIASES[item.id] ?? [])].some((name) =>
        said.some((word) => {
          // transcription sometimes glues the verb onto the name, like "paymum", so only that
          // prefix is stripped. names still match exactly, which keeps "feeling" from matching ling
          const bare = word.replace(/^(pay|send)(?=[a-z]{2})/, "");
          return word === name || bare === name;
        }),
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

// words that can follow "pay" or "to" without being a person's name
const NOT_NAMES = new Set([
  "me", "my", "money", "dollar", "dollars", "sgd", "bucks", "someone", "somebody",
  "them", "him", "her", "it", "now", "please", "the", "a", "an", "back", "to", "pay",
  "send", "and", "for", "this", "that", "here", "there", "you", "hundred",
  ...ONES,
  ...TENS.filter(Boolean),
]);

// finds the word used as the recipient, like "john" in "pay john 10" or "send 20 to john".
// used after contact matching fails, so penny can say the person is not in the contacts
export function findNamedPerson(text: string) {
  const clean = words(text).join(" ");
  // without a payment verb, "to" is just grammar, as in "what do i need to do"
  if (!/\b(pay|send|transfer)\b/.test(clean)) return "";
  const patterns = [
    /\b(?:pay|send|transfer)\s+(?:\$?\d+(?:\.\d+)?\s+(?:dollars?\s+)?)?([a-z]+)/,
    /\bto\s+([a-z]+)/,
  ];
  for (const pattern of patterns) {
    const name = clean.match(pattern)?.[1];
    if (name && !NOT_NAMES.has(name)) return name;
  }
  return "";
}

export function findAmount(text: string) {
  const digits = text.replace(/,/g, "").match(/\d+(?:\.\d{1,2})?/);
  return digits ? digits[0] : wordNumber(text);
}

// rule based "understanding": each regex is one intent, checked from most to least specific
export function companionReply(
  input: string,
  ctx: { issue: string; guiding: boolean; view: string; assist: AssistContext },
): CompanionResult {
  const text = input.toLowerCase();

  if (/\b(stop|cancel|never ?mind|no thanks|not now)\b/.test(text))
    return { kind: "stop", text: "No problem. I am here if you need me." };

  const contact = findContact(text);
  if (contact) return { kind: "pay", to: contact.id, amount: findAmount(text) };

  if (/\bfixed deposits?\b|\btime deposits?\b|\bterm deposits?\b/.test(text))
    return { kind: "fixed-deposit", text: respond(input, ctx.assist).text };

  // navigation runs before the unknown person check, otherwise "transfer screen"
  // would be read as a person called "screen"
  const target = NAV.find(([pattern]) => pattern.test(text))?.[1];
  if (target) {
    const view = target === "back" ? (BACK[ctx.view] ?? "home") : target;
    if (view === ctx.view || (target === "back" && ctx.view === "home"))
      return { kind: "say", text: `You're already on ${SCREEN_NAMES[ctx.view] ?? "this screen"}.` };
    return { kind: "go", view, text: `Opening ${SCREEN_NAMES[view] ?? "the previous screen"}.` };
  }

  const unknown = findNamedPerson(text);
  if (unknown)
    return {
      kind: "say",
      text: `There is no ${unknown[0].toUpperCase()}${unknown.slice(1)} in your contacts.`,
    };

  if (ctx.issue && /why|error|wrong|blocked|declined|problem|can.?t|cannot|fail/.test(text))
    return { kind: "say", text: issueLine(ctx.issue) };

  if (/\b(help|how|stuck|guide|show me|walk|what now|next|what do i|send|pay|transfer|yes|ok|okay|sure)\b/.test(text))
    return { kind: "guide" };

  return { kind: "say", text: FALLBACK_LINE };
}
