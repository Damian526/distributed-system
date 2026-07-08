// Just rough fixed rates, not live ones — good enough so totals aren't nonsense
const RATES_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  PLN: 0.25,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  PLN: 'zł',
  EUR: '€',
  USD: '$',
  GBP: '£',
};

// which currency each region's report should total up in
export const REGION_CURRENCY: Record<string, string> = {
  PL: 'PLN',
  DE: 'EUR',
  FR: 'EUR',
  NL: 'EUR',
  ES: 'EUR',
  CZ: 'EUR',
  GB: 'GBP',
  US: 'USD',
};

export function convertCurrency(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  const fromRate = RATES_TO_USD[from] ?? 1;
  const toRate = RATES_TO_USD[to] ?? 1;
  return (amount * fromRate) / toRate;
}
