import type { FixedDepositState } from "@/lib/types";

type FixedDepositTerms = {
  minimum: number;
  maximum: number;
  rateLabel: string;
  tenors: readonly { id: string; label: string }[];
};

// Illustrative application limits and terms, not a live bank offer.
export const FIXED_DEPOSIT: FixedDepositTerms = {
  minimum: 100,
  maximum: 50000,
  rateLabel: "Not quoted in this demo",
  tenors: [
    { id: "3", label: "3 months" },
    { id: "6", label: "6 months" },
    { id: "12", label: "12 months" },
    { id: "24", label: "24 months" },
  ],
};

export function validFixedDeposit(draft: FixedDepositState) {
  const amount = Number(draft.amount);
  return Number.isFinite(amount) && amount >= FIXED_DEPOSIT.minimum && amount <= FIXED_DEPOSIT.maximum &&
    FIXED_DEPOSIT.tenors.some((tenor) => tenor.id === draft.tenor) &&
    (draft.account === "everyday" || draft.account === "savings");
}
