// SHARED UTILITY — formatters.ts
//
// Rule: shared/utils/ holds pure functions with ZERO React dependency.
// They are used by multiple features. If only ONE feature uses it, it
// stays inside that feature folder — not here.

export const formatCurrency = (amount: number, currency = "USD"): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

export const formatNumber = (n: number): string =>
  new Intl.NumberFormat("en-US").format(n);

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const truncate = (str: string, max: number): string =>
  str.length <= max ? str : `${str.slice(0, max)}…`;
