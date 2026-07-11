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

// the whole report is global now, so everything totals up in one currency
export const GLOBAL_CURRENCY = 'USD';

// friendly names for the country codes we store on customers
export const COUNTRY_NAMES: Record<string, string> = {
  PL: 'Poland',
  DE: 'Germany',
  FR: 'France',
  NL: 'Netherlands',
  ES: 'Spain',
  CZ: 'Czechia',
  GB: 'United Kingdom',
  US: 'United States',
};

export function convertCurrency(
  amount: number,
  from: string,
  to: string,
): number {
  if (from === to) return amount;
  const fromRate = RATES_TO_USD[from] ?? 1;
  const toRate = RATES_TO_USD[to] ?? 1;
  return (amount * fromRate) / toRate;
}
