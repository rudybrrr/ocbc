export const JOURNEYS = {
  transfer: "Transfer",
  paynow: "PayNow",
  scan_and_pay: "Scan & Pay",
  foreign_exchange: "Foreign Exchange",
  fixed_deposit: "Fixed Deposit",
  start_investing: "Start investing",
  view_transactions: "View transactions",
  explore_offers: "Explore offers",
  talk_to_person: "Talk to a person",
  out_of_scope: "Outside this app",
  unclear: "Something else",
} as const;

export type Journey = keyof typeof JOURNEYS;
export type Intent = {
  journey: Journey;
  confidence: number;
  slots: { amount?: number; recipient?: string };
  clarify_question?: string;
  options?: Journey[];
};
export function isJourney(value: unknown): value is Journey {
  return typeof value === "string" && Object.hasOwn(JOURNEYS, value);
}
