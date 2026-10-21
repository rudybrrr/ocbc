import { CARD, SAMPLE_FUND } from "@/lib/data";
import { sgd } from "@/lib/format";
import type { ChatAction, ChatTopic, Mode, Screen } from "@/lib/types";

export type AssistContext = {
  mode: Mode;
  plainLanguage: boolean;
  screen: Screen;
  everyday: number;
  savings: number;
  investStep: number;
  monthly: 50 | 100 | 200 | null;
  investDone: boolean;
  lastIssue: string | null;
  lastTopic: ChatTopic | null;
};

export type Reply = { text: string; actions: ChatAction[]; topic?: ChatTopic };

const FIXED_DEPOSIT_ACTION: ChatAction = {
  label: "Explore Fixed Deposits",
  type: "navigate",
  actionId: "fixed_deposit.start",
};

function fixedDepositReply(query: string, affirmative = false): Reply {
  if (affirmative) {
    return {
      text: "I can show you a simulated application using sample amounts and terms. Nothing will be opened and no money will move.",
      actions: [FIXED_DEPOSIT_ACTION],
      topic: "fixed-deposit",
    };
  }

  if (/early|withdraw|access|need.*money|take.*out|break.*deposit/.test(query)) {
    return {
      text: "A fixed deposit is generally meant to stay in place until its maturity date. Depending on the product, an early withdrawal may not be allowed or may reduce or remove interest. Check the specific terms before setting money aside, and avoid locking away money you may need sooner.",
      actions: [
        { label: "How is interest set?", type: "ask", query: "How is fixed deposit interest set?" },
        { label: "Would you like to explore opening one?", type: "ask", query: "Yes, show me how." },
      ],
      topic: "fixed-deposit",
    };
  }

  if (/interest|rate|return|earn/.test(query)) {
    return {
      text: "A fixed deposit usually has an interest rate stated for a chosen term, so you can estimate the interest from the amount, rate, and term. Actual rates and eligibility depend on the bank's current offer. This demo does not show a live OCBC rate; any terms in its application are illustrative only.",
      actions: [
        { label: "What if I need the money early?", type: "ask", query: "What if I need the money early?" },
        { label: "Would you like to explore opening one?", type: "ask", query: "Yes, show me how." },
      ],
      topic: "fixed-deposit",
    };
  }

  return {
    text: "A fixed deposit is money placed with a bank for an agreed period, often at an interest rate set for that term. It can make returns more predictable and may offer a higher rate than an easy-access account. The trade-offs are reduced access to your money, possible loss of interest if you withdraw early, and the chance that a fixed rate may be less attractive if rates later rise. This is general education, not personal financial advice.",
    actions: [
      { label: "What if I need the money early?", type: "ask", query: "What if I need the money early?" },
      { label: "How is interest set?", type: "ask", query: "How is fixed deposit interest set?" },
      { label: "Would you like to explore opening one?", type: "ask", query: "Yes, show me how." },
    ],
    topic: "fixed-deposit",
  };
}

function norm(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9$.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function balanceReply(ctx: AssistContext): Reply {
  const text = ctx.plainLanguage
    ? `You can use ${sgd(ctx.everyday)} in Everyday Account today. Savings holds ${sgd(ctx.savings)}. The ${CARD.name} shows ${sgd(CARD.due)} due on ${CARD.dueLabel}.`
    : `Everyday Account ${sgd(ctx.everyday)}. Savings Account ${sgd(ctx.savings)}. ${CARD.name} ${sgd(CARD.due)} due ${CARD.dueLabel}. These figures are fictional.`;
  return {
    text,
    actions: [
      { label: "See accounts", type: "screen", screen: "home" },
      { label: "Move money", type: "screen", screen: "move" },
    ],
  };
}

function investReply(ctx: AssistContext, query: string): Reply {
  if (/what if|falls|fall|drop|lose|loss|risk/.test(query)) {
    return {
      text: "The sample mix can fall in price. If it was sold then, you could get back less than was put in. Money needed soon fits Everyday Account better than a fund. This is a general explanation, not advice for you.",
      actions: [
        { label: "Continue the walk", type: "screen", screen: "invest" },
        { label: "Talk to a person", type: "person" },
      ],
    };
  }

  if (ctx.investDone && ctx.monthly && /plan|a month|per month|horizon|saved/.test(query)) {
    return {
      text: `Your practice plan is ${sgd(ctx.monthly)} a month into the sample ${SAMPLE_FUND} mix. It is stored on this phone only. No money has moved, and this is not a recommendation.`,
      actions: [
        { label: "View practice plan", type: "screen", screen: "invest" },
        { label: "Is this advice?", type: "ask", query: "Is this personal financial advice?" },
      ],
    };
  }

  const definition = ctx.plainLanguage
    ? `A unit trust pools money from many people and buys a mix of investments. You would own units of that mix. The price of a unit can rise or fall.`
    : `A unit trust is a pooled fund. Investors own units, and the manager buys a stated mix of assets. Unit prices move with those assets, so the value can fall below what was paid.`;

  const offer = ctx.investDone
    ? ` You already have a practice plan for the sample ${SAMPLE_FUND} mix.`
    : ` The walk uses a fictional ${SAMPLE_FUND} mix and does not invest money.`;

  return {
    text: `${definition}${offer} It is education, not advice for you.`,
    actions: [
      {
        label: ctx.investDone ? "View practice plan" : ctx.investStep > 0 ? "Continue the walk" : "Start the walk",
        type: "screen",
        screen: "invest",
      },
      { label: "What if the value falls?", type: "ask", query: "What if the value falls?" },
    ],
  };
}

export function respond(input: string, ctx: AssistContext): Reply {
  const query = norm(input);

  if (
    ctx.lastTopic === "fixed-deposit" &&
    /^(yes|yeah|yep|sure|okay|ok)(\s|$)/.test(query) &&
    /show|how|explore|open|go|please|one/.test(query)
  ) {
    return fixedDepositReply(query, true);
  }

  if (/fixed deposit|fixed deposits|time deposit|term deposit/.test(query)) {
    return fixedDepositReply(query);
  }

  if (
    ctx.lastTopic === "fixed-deposit" &&
    /early|withdraw|access|interest|rate|return|earn|term|mature|risk|benefit|limit|how does|what happens/.test(query)
  ) {
    return fixedDepositReply(query);
  }

  if (/advice|should i (buy|invest)|recommend|right for me|personal advice/.test(query)) {
    return {
      text: "This is education about a sample fund, not advice for you. It does not look at income, debts, or when the money is needed. You can log a practice request to talk to a banker. This demo will not contact anyone.",
      actions: [
        { label: "Talk to a person", type: "person" },
        { label: "Back to the walk", type: "screen", screen: "invest" },
      ],
    };
  }

  if (/person|human|banker|someone|call me|talk to|stuck|real person/.test(query)) {
    return {
      text: "You can log a practice request for a banker. It stays on this phone. Nobody is called or emailed.",
      actions: [{ label: "Log a practice request", type: "person" }],
    };
  }

  if (ctx.lastIssue && /why|blocked|declined|error|did not|didn't|cannot|can't|rejected|failed/.test(query)) {
    return {
      text: ctx.lastIssue,
      actions: [
        { label: "Back to the payment", type: "screen", screen: "move" },
        { label: "Talk to a person", type: "person" },
      ],
    };
  }

  if (/what if|falls|fall|drop|lose money|risk/.test(query) || /unit trust|invest|shares|bond|horizon|fund/.test(query)) {
    return investReply(ctx, query);
  }

  if (/how much|balance|afford|can i use|everyday|savings|what do i have|my money/.test(query)) {
    return balanceReply(ctx);
  }

  if (/move|transfer|paynow|send money|pay |payment|fairprice|mum/.test(query)) {
    const text = ctx.plainLanguage
      ? `You can move money from Everyday (${sgd(ctx.everyday)}) or Savings (${sgd(ctx.savings)}). If the amount is too high, the payment stops and the screen tells you what to change.`
      : `Practice payments can leave Everyday (${sgd(ctx.everyday)}) or Savings (${sgd(ctx.savings)}) for your other account, Mum · Tan Mei Ling, or NTUC FairPrice. An amount above the balance is declined on the same form.`;
    return {
      text,
      actions: [{ label: "Move money", type: "screen", screen: "move" }],
    };
  }

  if (/guided|standard|text size|bigger text|larger text|switch mode|assistance/.test(query)) {
    return {
      text:
        ctx.mode === "guided"
          ? "Guided mode is on: one next step and larger controls. Standard mode shows accounts and activity together. Switching does not clear a practice plan or a payment you already typed."
          : "Standard mode is on: accounts and activity together. Guided mode switches to one next step and larger controls. Your practice plan and drafted payment stay either way.",
      actions: [{ label: "Adjust the bank", type: "prefs" }],
    };
  }

  if (/visa|credit card|card bill|the card/.test(query)) {
    return {
      text: `The ${CARD.name} shows ${sgd(CARD.due)} due on ${CARD.dueLabel}. Paying a card is not part of this practice bank.`,
      actions: [{ label: "See accounts", type: "screen", screen: "home" }],
    };
  }

  if (/^(hi|hello|hey|help)$/.test(query) || /what can you|what do you do/.test(query)) {
    return {
      text: "Ask in your own words. I can explain what you can use today, walk through a sample unit trust, or help when a practice payment does not go through.",
      actions: [
        { label: "What can I use today?", type: "ask", query: "How much can I use today?" },
        { label: "Explain a unit trust", type: "ask", query: "Explain a unit trust simply" },
        { label: "Move money", type: "screen", screen: "move" },
      ],
    };
  }

  return {
    text: "I can explain what you can use today, walk through a sample unit trust, or help with a practice payment. I cannot give personal financial advice.",
    actions: [
      { label: "What can I use today?", type: "ask", query: "How much can I use today?" },
      { label: "Explain a unit trust", type: "ask", query: "Explain a unit trust simply" },
      { label: "Talk to a person", type: "person" },
    ],
  };
}

export function suggestions(ctx: AssistContext): string[] {
  if (ctx.lastIssue) {
    return ["Why was that payment blocked?", "How much can I use today?", "Talk to a person"];
  }
  if (ctx.lastTopic === "fixed-deposit") {
    return ["What if I need the money early?", "How is interest set?", "Yes, show me how."];
  }
  if (ctx.screen === "invest") {
    return ["What if the value falls?", "Is this personal financial advice?", "Talk to a person"];
  }
  if (ctx.investDone) {
    return ["What is my practice plan?", "How much can I use today?", "I want to move money"];
  }
  return ["How much can I use today?", "Explain a unit trust simply", "I want to move money"];
}
