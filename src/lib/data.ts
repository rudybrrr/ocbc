import type { AccountId, DestinationId, Transfer } from "@/lib/types";

export const CUSTOMER = "Aisha Rahman";

export const OPENING = {
  everyday: 256.05,
  savings: 0,
} as const;

export const CARD = {
  name: "Sample Visa",
  due: 640.2,
  dueLabel: "28 Oct",
} as const;

export const ACCOUNTS: { id: AccountId; name: string; detail: string }[] = [
  { id: "everyday", name: "OCBC FRANK Account", detail: "Spending" },
  { id: "savings", name: "Savings Account", detail: "Set aside" },
];

export const DESTINATIONS: {
  id: DestinationId;
  name: string;
  detail: string;
  phone?: string;
}[] = [
  { id: "everyday", name: "OCBC FRANK Account", detail: "Your account" },
  { id: "savings", name: "Savings Account", detail: "Your account" },
  { id: "alicia", name: "Alex Tan", detail: "PayNow", phone: "+65 •••• 0001" },
  {
    id: "amanda",
    name: "Jamie Lim",
    detail: "PayNow",
    phone: "+65 •••• 0002",
  },
  { id: "aqil", name: "Casey Lee", detail: "PayNow", phone: "+65 •••• 0003" },
  { id: "arc", name: "Robin Wong", detail: "PayNow", phone: "+65 •••• 0004" },
  {
    id: "aren",
    name: "Morgan Chua",
    detail: "PayNow",
    phone: "+65 •••• 0005",
  },
  { id: "ashneel1", name: "Taylor Goh", detail: "PayNow", phone: "+65 •••• 0006" },
  { id: "ashneel2", name: "Sam Teo", detail: "PayNow", phone: "+65 •••• 0007" },
  { id: "asther", name: "Riley Ng", detail: "PayNow", phone: "+65 •••• 0008" },
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
    detail: "OCBC FRANK Account",
    amount: 4850,
    at: "2026-10-17T09:00:00+08:00",
  },
  {
    id: "seed-ntuc",
    title: "NTUC FairPrice",
    detail: "OCBC FRANK Account",
    amount: -42.8,
    at: "2026-10-18T19:12:00+08:00",
  },
  {
    id: "seed-grab",
    title: "Grab",
    detail: "OCBC FRANK Account",
    amount: -18.4,
    at: "2026-10-18T08:40:00+08:00",
  },
  {
    id: "seed-spotify",
    title: "Spotify",
    detail: "OCBC FRANK Account",
    amount: -11.98,
    at: "2026-10-09T06:00:00+08:00",
  },
  {
    id: "seed-mum",
    title: "Mum · Tan Mei Ling",
    detail: "PayNow · OCBC FRANK Account",
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
