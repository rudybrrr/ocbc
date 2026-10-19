import type { AccountId, DestinationId, Transfer } from "@/lib/types";

export const CUSTOMER = "Aisha Rahman";

export const OPENING = {
  everyday: 12480.35,
  savings: 8240,
} as const;

export const CARD = {
  name: "Sample Visa",
  due: 640.2,
  dueLabel: "28 Oct",
} as const;

export const ACCOUNTS: { id: AccountId; name: string; detail: string }[] = [
  { id: "everyday", name: "Everyday Account", detail: "Spending" },
  { id: "savings", name: "Savings Account", detail: "Set aside" },
];

export const DESTINATIONS: { id: DestinationId; name: string; detail: string }[] = [
  { id: "everyday", name: "Everyday Account", detail: "Your account" },
  { id: "savings", name: "Savings Account", detail: "Your account" },
  { id: "mum", name: "Mum · Tan Mei Ling", detail: "PayNow" },
  { id: "fairprice", name: "NTUC FairPrice", detail: "PayNow" },
];

export type ActivityRow = {
  id: string;
  title: string;
  detail: string;
  amount: number;
  at: string;
};

const SEED: ActivityRow[] = [
  {
    id: "seed-salary",
    title: "Salary · Harbour & Co",
    detail: "Everyday Account",
    amount: 4850,
    at: "2026-10-17T09:00:00+08:00",
  },
  {
    id: "seed-ntuc",
    title: "NTUC FairPrice",
    detail: "Everyday Account",
    amount: -42.8,
    at: "2026-10-18T19:12:00+08:00",
  },
  {
    id: "seed-grab",
    title: "Grab",
    detail: "Everyday Account",
    amount: -18.4,
    at: "2026-10-18T08:40:00+08:00",
  },
  {
    id: "seed-spotify",
    title: "Spotify",
    detail: "Everyday Account",
    amount: -11.98,
    at: "2026-10-09T06:00:00+08:00",
  },
  {
    id: "seed-mum",
    title: "Mum · Tan Mei Ling",
    detail: "PayNow · Everyday Account",
    amount: -200,
    at: "2026-10-05T21:05:00+08:00",
  },
];

export function accountName(id: AccountId) {
  return ACCOUNTS.find((account) => account.id === id)?.name ?? id;
}

export function destinationName(id: DestinationId) {
  return DESTINATIONS.find((item) => item.id === id)?.name ?? id;
}

export function balances(transfers: Transfer[]) {
  const next: Record<AccountId, number> = {
    everyday: OPENING.everyday,
    savings: OPENING.savings,
  };
  for (const transfer of transfers) {
    next[transfer.from] -= transfer.amount;
    if (transfer.to === "everyday" || transfer.to === "savings") {
      next[transfer.to] += transfer.amount;
    }
  }
  return next;
}

export function activity(transfers: Transfer[]): ActivityRow[] {
  const moved: ActivityRow[] = transfers.map((transfer) => ({
    id: transfer.id,
    title: destinationName(transfer.to),
    detail: transfer.note
      ? `From ${accountName(transfer.from)} · ${transfer.note}`
      : `From ${accountName(transfer.from)}`,
    amount: -transfer.amount,
    at: transfer.at,
  }));
  return [...moved, ...SEED].sort((a, b) => (a.at < b.at ? 1 : -1));
}

export const SAMPLE_FUND = "Horizon Balanced";
