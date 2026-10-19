const sgdFormat = new Intl.NumberFormat("en-SG", {
  style: "currency",
  currency: "SGD",
  currencyDisplay: "narrowSymbol",
});

const numberFormat = new Intl.NumberFormat("en-SG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormat = new Intl.DateTimeFormat("en-SG", {
  day: "numeric",
  month: "short",
});

export function sgd(amount: number) {
  return sgdFormat.format(amount);
}

export function spokenSgd(amount: number) {
  return `${numberFormat.format(Math.abs(amount))} Singapore dollars`;
}

export function shortDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

export function dayKey(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const same =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  if (same) return "Today";
  return dateFormat.format(date);
}
