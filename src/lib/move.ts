import { accountName, balances, destinationName } from "@/lib/data";
import { sgd } from "@/lib/format";
import type { Draft, Transfer } from "@/lib/types";

export type MoveResult =
  | { ok: true; amount: number }
  | { ok: false; field: "amount" | "to"; title: string; recovery: string; fill?: string };

export function parseAmount(raw: string) {
  const cleaned = raw.trim().replace(/[$,\s]/g, "");
  if (!cleaned) return { ok: false as const, reason: "empty" as const };
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return { ok: false as const, reason: "format" as const };
  }
  const amount = Number(cleaned);
  if (amount <= 0) return { ok: false as const, reason: "zero" as const };
  return { ok: true as const, amount };
}

export function validateMove(draft: Draft, transfers: Transfer[]): MoveResult {
  if (draft.from === draft.to) {
    return {
      ok: false,
      field: "to",
      title: "The money would leave and return to the same account.",
      recovery: "Choose a different destination.",
    };
  }

  const parsed = parseAmount(draft.amount);
  const available = balances(transfers)[draft.from];

  if (!parsed.ok && parsed.reason === "empty") {
    return {
      ok: false,
      field: "amount",
      title: "Enter an amount to move.",
      recovery: "Use digits, for example 50.",
    };
  }

  if (!parsed.ok && parsed.reason === "format") {
    return {
      ok: false,
      field: "amount",
      title: "That amount is not a valid sum.",
      recovery: "Use dollars and up to two cents, for example 50.00.",
    };
  }

  if (!parsed.ok) {
    return {
      ok: false,
      field: "amount",
      title: "Enter an amount greater than zero.",
      recovery: "Try 50 if you want a small practice payment.",
    };
  }

  if (parsed.amount > available + 0.001) {
    const other = draft.from === "everyday" ? "savings" : "everyday";
    const otherBalance = balances(transfers)[other];
    if (available <= 0) {
      return {
        ok: false,
        field: "amount",
        title: `${accountName(draft.from)} has nothing available to move.`,
        recovery: `${accountName(other)} has ${sgd(otherBalance)}. Choose that account instead.`,
      };
    }
    return {
      ok: false,
      field: "amount",
      title: `${sgd(parsed.amount)} is more than the ${sgd(available)} in ${accountName(draft.from)}.`,
      recovery: `Enter ${sgd(available)} or less, or move money from ${accountName(other)} first.`,
      fill: available.toFixed(2),
    };
  }

  return { ok: true, amount: Math.round(parsed.amount * 100) / 100 };
}

export function receiptLine(draft: Draft, amount: number) {
  return `${sgd(amount)} from ${accountName(draft.from)} to ${destinationName(draft.to)}.`;
}
