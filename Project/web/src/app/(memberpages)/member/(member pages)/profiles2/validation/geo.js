// Geography helpers: currency per country, time zone -> country (for soft consistency checks only).
export const CURRENCY = { US: 'USD', CA: 'CAD', MX: 'MXN', BR: 'BRL', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN', GB: 'GBP', IE: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', PT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR', SK: 'EUR', SI: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', MT: 'EUR', CY: 'EUR', HR: 'EUR', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', IS: 'ISK', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN', RS: 'RSD', UA: 'UAH', RU: 'RUB', BY: 'BYN', TR: 'TRY', IL: 'ILS', SA: 'SAR', AE: 'AED', QA: 'QAR', KW: 'KWD', BH: 'BHD', OM: 'OMR', JO: 'JOD', LB: 'LBP', EG: 'EGP', MA: 'MAD', DZ: 'DZD', TN: 'TND', NG: 'NGN', GH: 'GHS', KE: 'KES', UG: 'UGX', TZ: 'TZS', ET: 'ETB', ZA: 'ZAR', IN: 'INR', PK: 'PKR', BD: 'BDT', LK: 'LKR', NP: 'NPR', CN: 'CNY', HK: 'HKD', TW: 'TWD', JP: 'JPY', KR: 'KRW', SG: 'SGD', MY: 'MYR', ID: 'IDR', TH: 'THB', VN: 'VND', PH: 'PHP', AU: 'AUD', NZ: 'NZD', IR: 'IRR', IQ: 'IQD', KZ: 'KZT', UZ: 'UZS', MN: 'MNT', KH: 'KHR', MM: 'MMK', LA: 'LAK' };
export const currencyFor = (cc) => CURRENCY[cc] || 'USD';

const TZ = {
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Shanghai': 'CN', 'Asia/Chongqing': 'CN', 'Asia/Urumqi': 'CN', 'Asia/Hong_Kong': 'HK', 'Asia/Taipei': 'TW', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR',
  'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Jakarta': 'ID', 'Asia/Makassar': 'ID', 'Asia/Jayapura': 'ID', 'Asia/Bangkok': 'TH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Saigon': 'VN', 'Asia/Manila': 'PH',
  'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD', 'Asia/Colombo': 'LK', 'Asia/Kathmandu': 'NP', 'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW', 'Asia/Bahrain': 'BH', 'Asia/Muscat': 'OM',
  'Asia/Tehran': 'IR', 'Asia/Baghdad': 'IQ', 'Asia/Jerusalem': 'IL', 'Asia/Tel_Aviv': 'IL', 'Asia/Amman': 'JO', 'Asia/Beirut': 'LB', 'Asia/Almaty': 'KZ', 'Asia/Tashkent': 'UZ', 'Asia/Ulaanbaatar': 'MN',
  'Asia/Phnom_Penh': 'KH', 'Asia/Yangon': 'MM', 'Asia/Vientiane': 'LA', 'Asia/Kabul': 'AF', 'Asia/Yerevan': 'AM', 'Asia/Baku': 'AZ', 'Asia/Tbilisi': 'GE',
  'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Lisbon': 'PT', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE',
  'Europe/Vienna': 'AT', 'Europe/Zurich': 'CH', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Helsinki': 'FI', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Budapest': 'HU',
  'Europe/Bucharest': 'RO', 'Europe/Sofia': 'BG', 'Europe/Athens': 'GR', 'Europe/Istanbul': 'TR', 'Europe/Kiev': 'UA', 'Europe/Kyiv': 'UA', 'Europe/Moscow': 'RU', 'Europe/Minsk': 'BY', 'Europe/Belgrade': 'RS',
  'Europe/Zagreb': 'HR', 'Europe/Ljubljana': 'SI', 'Europe/Bratislava': 'SK', 'Europe/Vilnius': 'LT', 'Europe/Riga': 'LV', 'Europe/Tallinn': 'EE', 'Europe/Luxembourg': 'LU', 'Europe/Malta': 'MT', 'Atlantic/Reykjavik': 'IS',
  'Africa/Cairo': 'EG', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE', 'Africa/Johannesburg': 'ZA', 'Africa/Casablanca': 'MA', 'Africa/Algiers': 'DZ', 'Africa/Tunis': 'TN', 'Africa/Accra': 'GH', 'Africa/Addis_Ababa': 'ET',
  'Africa/Kampala': 'UG', 'Africa/Dar_es_Salaam': 'TZ', 'America/Sao_Paulo': 'BR', 'America/Argentina/Buenos_Aires': 'AR', 'America/Buenos_Aires': 'AR', 'America/Santiago': 'CL', 'America/Bogota': 'CO', 'America/Lima': 'PE',
  'America/Mexico_City': 'MX', 'America/Monterrey': 'MX', 'America/Tijuana': 'MX', 'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA', 'America/Winnipeg': 'CA', 'America/Halifax': 'CA',
  'America/Caracas': 'VE', 'America/Guayaquil': 'EC', 'America/Montevideo': 'UY', 'America/Puerto_Rico': 'PR', 'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU', 'Pacific/Auckland': 'NZ'
};
export function timezoneCountry(tz) {
  if (!tz) return null;
  if (TZ[tz]) return TZ[tz];
  if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Indiana|Kentucky|Boise)|^Pacific\/Honolulu|^US\//.test(tz)) return 'US';
  return null;
}
/** Countries where a browser language is commonly used (very rough; used for soft signals only). */
export function languageFitsCountry(lang, cc) {
  const l = String(lang || '').toLowerCase().split('-')[0];
  const region = String(lang || '').split('-')[1];
  if (region && region.toUpperCase() === cc) return true;
  const MAP = { en: null, es: 'ES MX AR CO CL PE VE EC GT CU BO DO HN PY SV NI CR PA UY PR US', fr: 'FR BE CH CA LU MA DZ TN SN CI CM', de: 'DE AT CH LU LI', pt: 'PT BR AO MZ', ar: 'SA AE EG QA KW BH OM JO LB IQ MA DZ TN LY SY YE', zh: 'CN TW HK SG MO MY', hi: 'IN', bn: 'BD IN', ru: 'RU BY KZ UA KG', it: 'IT CH SM', nl: 'NL BE SR', ja: 'JP', ko: 'KR', tr: 'TR CY', pl: 'PL', uk: 'UA', vi: 'VN', th: 'TH', id: 'ID', ms: 'MY SG BN', fa: 'IR AF', ur: 'PK IN', he: 'IL', sv: 'SE FI', no: 'NO', nb: 'NO', da: 'DK', fi: 'FI', el: 'GR CY', cs: 'CZ', hu: 'HU', ro: 'RO MD', ta: 'IN LK SG', te: 'IN', mr: 'IN', gu: 'IN', kn: 'IN', ml: 'IN', pa: 'IN PK', sw: 'KE TZ UG', fil: 'PH', tl: 'PH' };
  if (MAP[l] === null) return true; // English is global
  return MAP[l] ? MAP[l].split(' ').includes(cc) : true;
}
