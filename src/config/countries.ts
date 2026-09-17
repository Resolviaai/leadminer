export const TIER_1_COUNTRIES = [
  'US', // United States
  'GB', // United Kingdom
  'CA', // Canada
  'AU', // Australia
  'NZ', // New Zealand
  'IE', // Ireland
  'NL', // Netherlands
  'SE', // Sweden
  'DE', // Germany
  'NO', // Norway
  'DK', // Denmark
  'FI', // Finland
  'CH', // Switzerland
  'AT', // Austria
  'BE', // Belgium
  'SG', // Singapore
  'AE', // United Arab Emirates
] as const;

export type Tier1CountryCode = (typeof TIER_1_COUNTRIES)[number];

export const TIER_1_COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  NZ: 'New Zealand',
  IE: 'Ireland',
  NL: 'Netherlands',
  SE: 'Sweden',
  DE: 'Germany',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  CH: 'Switzerland',
  AT: 'Austria',
  BE: 'Belgium',
  SG: 'Singapore',
  AE: 'United Arab Emirates',
};

export const TIER_1_COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  GB: '🇬🇧',
  CA: '🇨🇦',
  AU: '🇦🇺',
  NZ: '🇳🇿',
  IE: '🇮🇪',
  NL: '🇳🇱',
  SE: '🇸🇪',
  DE: '🇩🇪',
  NO: '🇳🇴',
  DK: '🇩🇰',
  FI: '🇫🇮',
  CH: '🇨🇭',
  AT: '🇦🇹',
  BE: '🇧🇪',
  SG: '🇸🇬',
  AE: '🇦🇪',
};

export function isTier1Country(countryCode?: string | null): boolean {
  if (!countryCode) return false;
  return TIER_1_COUNTRIES.includes(countryCode.toUpperCase() as any);
}

export function getCountryDisplayName(countryCode?: string | null): string {
  if (!countryCode) return 'Unknown';
  const code = countryCode.toUpperCase();
  const name = TIER_1_COUNTRY_NAMES[code] || code;
  const flag = TIER_1_COUNTRY_FLAGS[code];
  return flag ? `${flag} ${name}` : name;
}
