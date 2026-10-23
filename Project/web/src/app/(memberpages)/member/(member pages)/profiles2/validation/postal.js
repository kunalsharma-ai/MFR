// Country-specific postal codes (patterns follow the Google/CLDR address metadata). Never one numeric regex.
import { ok, bad, flag } from './result.js';

export const POSTAL = {
  US: [/^\d{5}(-\d{4})?$/, '10001'], CA: [/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/, 'M5V 3A8'],
  GB: [/^(GIR ?0AA|(([A-Z][0-9]{1,2})|([A-Z][A-HJ-Y][0-9]{1,2})|([A-Z][0-9][A-Z])|([A-Z][A-HJ-Y][0-9][A-Z]?)) ?[0-9][A-Z]{2})$/, 'SW1A 1AA'],
  IN: [/^[1-9]\d{5}$/, '110001'], AU: [/^\d{4}$/, '2000'], NZ: [/^\d{4}$/, '6011'], DE: [/^\d{5}$/, '10115'], FR: [/^\d{2} ?\d{3}$/, '75008'],
  IT: [/^\d{5}$/, '00118'], ES: [/^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/, '28013'], PT: [/^\d{4}-\d{3}$/, '1100-148'], NL: [/^[1-9]\d{3} ?[A-Z]{2}$/, '1012 JS'],
  BE: [/^\d{4}$/, '1000'], LU: [/^\d{4}$/, '1009'], CH: [/^\d{4}$/, '8001'], AT: [/^\d{4}$/, '1010'], LI: [/^94\d{2}$/, '9490'], DK: [/^\d{4}$/, '1050'],
  SE: [/^\d{3} ?\d{2}$/, '111 22'], NO: [/^\d{4}$/, '0150'], FI: [/^\d{5}$/, '00100'], IS: [/^\d{3}$/, '101'], IE: [/^[AC-FHKNPRTV-Y][0-9]{2}|D6W ?[0-9AC-FHKNPRTV-Y]{4}$/, 'D02 X285'],
  PL: [/^\d{2}-\d{3}$/, '00-001'], CZ: [/^\d{3} ?\d{2}$/, '110 00'], SK: [/^\d{3} ?\d{2}$/, '811 01'], HU: [/^\d{4}$/, '1051'], RO: [/^\d{6}$/, '010011'],
  BG: [/^\d{4}$/, '1000'], GR: [/^\d{3} ?\d{2}$/, '105 57'], HR: [/^\d{5}$/, '10000'], SI: [/^\d{4}$/, '1000'], RS: [/^\d{5,6}$/, '11000'],
  EE: [/^\d{5}$/, '10111'], LV: [/^LV-?\d{4}$/, 'LV-1050'], LT: [/^(LT-?)?\d{5}$/, 'LT-01100'], UA: [/^\d{5}$/, '01001'], RU: [/^\d{6}$/, '101000'],
  BY: [/^\d{6}$/, '220030'], TR: [/^\d{5}$/, '34000'], CY: [/^\d{4}$/, '1010'], MT: [/^[A-Z]{3} ?\d{2,4}$/, 'VLT 1117'], IL: [/^\d{5}(\d{2})?$/, '6100000'],
  SA: [/^\d{5}(-\d{4})?$/, '11564'], EG: [/^\d{5}$/, '11511'], MA: [/^\d{5}$/, '10000'], DZ: [/^\d{5}$/, '16000'], TN: [/^\d{4}$/, '1000'],
  ZA: [/^\d{4}$/, '2001'], NG: [/^\d{6}$/, '100001'], KE: [/^\d{5}$/, '00100'], ET: [/^\d{4}$/, '1000'], IR: [/^\d{5}-?\d{5}$/, '11369-14331'], IQ: [/^\d{5}$/, '10001'],
  PK: [/^\d{5}$/, '44000'], BD: [/^\d{4}$/, '1000'], LK: [/^\d{5}$/, '00100'], NP: [/^\d{5}$/, '44600'], CN: [/^\d{6}$/, '100000'], JP: [/^\d{3}-?\d{4}$/, '100-0001'],
  KR: [/^\d{5}$/, '03187'], TW: [/^\d{3}(\d{2,3})?$/, '100'], SG: [/^\d{6}$/, '018956'], MY: [/^\d{5}$/, '50050'], ID: [/^\d{5}$/, '10110'], TH: [/^\d{5}$/, '10200'],
  VN: [/^\d{6}$/, '100000'], PH: [/^\d{4}$/, '1000'], KH: [/^\d{5,6}$/, '12000'], MN: [/^\d{5}$/, '14200'], KZ: [/^(\d{6}|[A-Z]\d{2}[A-Z]\d[A-Z]\d)$/, '050000'],
  UZ: [/^\d{6}$/, '100000'], MX: [/^\d{5}$/, '06000'], BR: [/^\d{5}-?\d{3}$/, '01310-100'], AR: [/^([A-HJ-NP-Z]\d{4}[A-Z]{3}|\d{4})$/, 'C1002AAA'], CL: [/^\d{7}$/, '8320000'],
  CO: [/^\d{6}$/, '110111'], PE: [/^\d{5}$/, '15001'], EC: [/^\d{6}$/, '170150'], VE: [/^\d{4}$/, '1010'], UY: [/^\d{5}$/, '11000'], PY: [/^\d{4}$/, '1209'],
  CR: [/^\d{5}$/, '10101'], GT: [/^\d{5}$/, '01001'], DO: [/^\d{5}$/, '10101'], PR: [/^00[679]\d{2}(-\d{4})?$/, '00901'], PA: [/^\d{4}$/, '0801'], CU: [/^\d{5}$/, '10400'],
  MV: [/^\d{5}$/, '20026'], AF: [/^\d{4}$/, '1001'], JO: [/^\d{5}$/, '11118'], LB: [/^(\d{4}|\d{4} ?\d{4})$/, '1107 2810'], OM: [/^\d{3}$/, '100'], KW: [/^\d{5}$/, '13001'], BH: [/^(1[0-2]|[1-9])\d{2}$/, '317']
};
// Countries/territories without a postal-code system: the question becomes optional there.
export const NO_POSTAL = new Set(['AE', 'QA', 'HK', 'MO', 'AO', 'AG', 'AW', 'BS', 'BZ', 'BJ', 'BO', 'BW', 'BF', 'BI', 'CM', 'CF', 'TD', 'KM', 'CG', 'CD', 'CK', 'CI', 'DJ', 'DM', 'GQ', 'ER', 'FJ', 'TF', 'GM', 'GH', 'GD', 'GY', 'KI', 'ML', 'MR', 'MS', 'NR', 'NU', 'KP', 'RW', 'KN', 'LC', 'ST', 'SC', 'SL', 'SB', 'SR', 'SY', 'TL', 'TG', 'TK', 'TO', 'TV', 'UG', 'VU', 'YE', 'ZW', 'IE_NONE']);

export function normalizePostal(v) { return String(v || '').toUpperCase().replace(/\s+/g, ' ').trim(); }

export function validatePostal(raw, o = {}) {
  const country = o.country;
  const v = normalizePostal(raw);
  if (!v) return o.optional || NO_POSTAL.has(country) ? ok('') : bad('e.required');
  if (/^(0+|1234|12345|123456|99999|00000|000000|111111|N\/?A|NONE|NA)$/.test(v.replace(/[\s-]/g, '')) && !NO_POSTAL.has(country)) {
    // obviously fake - but a few real codes (e.g. 00100 Helsinki) are excluded by country rules below
    if (!(POSTAL[country] && POSTAL[country][0].test(v) && !/^(0+|1+)$/.test(v.replace(/\D/g, '')))) return bad('e.zipFake');
  }
  const rule = POSTAL[country];
  if (rule) {
    if (!rule[0].test(v)) return bad('e.zipCountry', { ex: rule[1] });
    return ok(v);
  }
  if (!/^[A-Z0-9][A-Z0-9 -]{1,9}$/.test(v)) return bad('e.zip');
  return ok(v, [flag('postal_unverified_format', 0, country)]);
}
export const postalExample = (country) => POSTAL[country]?.[1] || '';
