import type { Transfer } from "@/lib/types";

// One token is a fixed slice of the weekly spending money, so the count is a simpler way to read the same dollars.
export const TOKEN_VALUE = 5;
export const DEFAULT_WEEKLY_BUDGET = 60;
export const MIN_WEEKLY_BUDGET = 10;
export const MAX_WEEKLY_BUDGET = 500;

export type TokenState = {
  total: number;
  left: number;
  full: number;
  partial: boolean;
  spent: number;
  budget: number;
  tone: "good" | "low" | "empty";
};

export type SpendItem = { id: string; title: string; amount: number };

export function clampBudget(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_WEEKLY_BUDGET;
  const stepped = Math.round(value / TOKEN_VALUE) * TOKEN_VALUE;
  return Math.min(MAX_WEEKLY_BUDGET, Math.max(MIN_WEEKLY_BUDGET, stepped));
}

// weeks run Monday to Sunday and refill on Monday
export function weekStart(now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

export function weeklySpending(transfers: Transfer[], now: Date, destinationName: (id: Transfer["to"]) => string) {
  const start = weekStart(now).toISOString();
  // moving money between your own accounts is saving, not spending
  const paid = transfers
    .filter((transfer) => transfer.at >= start && transfer.to !== "savings" && transfer.to !== "everyday")
    .map((transfer) => ({ id: transfer.id, title: destinationName(transfer.to), amount: transfer.amount }));
  const items = paid.reverse();
  const spent = items.reduce((sum, item) => sum + item.amount, 0);
  return { items, spent: Math.round(spent * 100) / 100 };
}

export function tokenState(budget: number, spent: number): TokenState {
  const total = Math.max(1, Math.round(budget / TOKEN_VALUE));
  const leftExact = Math.max(0, (budget - spent) / TOKEN_VALUE);
  // round to the nearest half so "8½ tokens" stays easy to read
  const left = Math.min(total, Math.round(leftExact * 2) / 2);
  const full = Math.floor(left);
  const partial = left - full >= 0.5;
  const tone = left <= 0 ? "empty" : left <= 2 ? "low" : "good";
  return { total, left, full, partial, spent, budget, tone };
}

export function formatTokens(value: number) {
  const whole = Math.floor(value);
  const half = value - whole >= 0.5;
  if (!half) return String(whole);
  return whole === 0 ? "½" : `${whole}½`;
}

export function tokenWord(value: number) {
  return value === 1 ? "token" : "tokens";
}
