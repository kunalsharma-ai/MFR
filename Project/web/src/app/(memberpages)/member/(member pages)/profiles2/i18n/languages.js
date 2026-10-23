// Language catalogue.
//  full: true  -> hand-translated UI pack in public/i18n/ui/<code>.json
//  full: false -> UI + content are machine-translated at runtime (see contentTranslator.js)
//  flag: ISO country used for the flag image, rtl: right-to-left script
export const LANGS = [
  { code: 'en', name: 'English', native: 'English', flag: 'gb', full: true },
  { code: 'zh-CN', name: 'Chinese (Simplified)', native: '简体中文', flag: 'cn', full: true },
  { code: 'zh-TW', name: 'Chinese (Traditional)', native: '繁體中文', flag: 'tw', full: true },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: 'in', full: true },
  { code: 'es', name: 'Spanish', native: 'Español', flag: 'es', full: true },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: 'sa', full: true, rtl: true },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: 'bd', full: true },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: 'br', full: true },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: 'ru', full: true },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: 'jp', full: true },
  { code: 'fr', name: 'French', native: 'Français', flag: 'fr', full: true },
  { code: 'de', name: 'German', native: 'Deutsch', flag: 'de', full: true },
  { code: 'ko', name: 'Korean', native: '한국어', flag: 'kr', full: true },
  { code: 'it', name: 'Italian', native: 'Italiano', flag: 'it', full: true },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', flag: 'tr', full: true },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', flag: 'vn', full: true },
  { code: 'ur', name: 'Urdu', native: 'اردو', flag: 'pk', full: true, rtl: true },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: 'id', full: true },
  { code: 'th', name: 'Thai', native: 'ไทย', flag: 'th', full: true },
  { code: 'fa', name: 'Persian', native: 'فارسی', flag: 'ir', full: true, rtl: true },
  { code: 'pl', name: 'Polish', native: 'Polski', flag: 'pl', full: true },
  { code: 'uk', name: 'Ukrainian', native: 'Українська', flag: 'ua', full: true },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', flag: 'nl', full: true },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', flag: 'my', full: true },
  { code: 'fil', name: 'Filipino', native: 'Filipino', flag: 'ph', full: true },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili', flag: 'ke', full: true },
  { code: 'he', name: 'Hebrew', native: 'עברית', flag: 'il', full: true, rtl: true },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: 'in', full: true },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: 'in', full: true },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: 'in', full: true },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: 'in', full: true },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: 'in', full: true },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: 'in', full: true },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: 'in', full: true },
  // ---- auto-translated (needs a translation provider, see README) ----
  { code: 'af', name: 'Afrikaans', native: 'Afrikaans', flag: 'za' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ', flag: 'et' },
  { code: 'sq', name: 'Albanian', native: 'Shqip', flag: 'al' },
  { code: 'hy', name: 'Armenian', native: 'Հայերեն', flag: 'am' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', flag: 'in' },
  { code: 'az', name: 'Azerbaijani', native: 'Azərbaycan', flag: 'az' },
  { code: 'eu', name: 'Basque', native: 'Euskara', flag: 'es' },
  { code: 'be', name: 'Belarusian', native: 'Беларуская', flag: 'by' },
  { code: 'bs', name: 'Bosnian', native: 'Bosanski', flag: 'ba' },
  { code: 'bg', name: 'Bulgarian', native: 'Български', flag: 'bg' },
  { code: 'my', name: 'Burmese', native: 'မြန်မာ', flag: 'mm' },
  { code: 'ca', name: 'Catalan', native: 'Català', flag: 'ad' },
  { code: 'hr', name: 'Croatian', native: 'Hrvatski', flag: 'hr' },
  { code: 'cs', name: 'Czech', native: 'Čeština', flag: 'cz' },
  { code: 'da', name: 'Danish', native: 'Dansk', flag: 'dk' },
  { code: 'et', name: 'Estonian', native: 'Eesti', flag: 'ee' },
  { code: 'fi', name: 'Finnish', native: 'Suomi', flag: 'fi' },
  { code: 'ka', name: 'Georgian', native: 'ქართული', flag: 'ge' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά', flag: 'gr' },
  { code: 'ha', name: 'Hausa', native: 'Hausa', flag: 'ng' },
  { code: 'hu', name: 'Hungarian', native: 'Magyar', flag: 'hu' },
  { code: 'is', name: 'Icelandic', native: 'Íslenska', flag: 'is' },
  { code: 'ig', name: 'Igbo', native: 'Igbo', flag: 'ng' },
  { code: 'ga', name: 'Irish', native: 'Gaeilge', flag: 'ie' },
  { code: 'jv', name: 'Javanese', native: 'Basa Jawa', flag: 'id' },
  { code: 'kk', name: 'Kazakh', native: 'Қазақ', flag: 'kz' },
  { code: 'km', name: 'Khmer', native: 'ខ្មែរ', flag: 'kh' },
  { code: 'rw', name: 'Kinyarwanda', native: 'Kinyarwanda', flag: 'rw' },
  { code: 'ku', name: 'Kurdish', native: 'Kurdî', flag: 'iq' },
  { code: 'ky', name: 'Kyrgyz', native: 'Кыргызча', flag: 'kg' },
  { code: 'lo', name: 'Lao', native: 'ລາວ', flag: 'la' },
  { code: 'lv', name: 'Latvian', native: 'Latviešu', flag: 'lv' },
  { code: 'lt', name: 'Lithuanian', native: 'Lietuvių', flag: 'lt' },
  { code: 'mk', name: 'Macedonian', native: 'Македонски', flag: 'mk' },
  { code: 'mg', name: 'Malagasy', native: 'Malagasy', flag: 'mg' },
  { code: 'mt', name: 'Maltese', native: 'Malti', flag: 'mt' },
  { code: 'mi', name: 'Maori', native: 'Māori', flag: 'nz' },
  { code: 'mn', name: 'Mongolian', native: 'Монгол', flag: 'mn' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली', flag: 'np' },
  { code: 'no', name: 'Norwegian', native: 'Norsk', flag: 'no' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', flag: 'in' },
  { code: 'ps', name: 'Pashto', native: 'پښتو', flag: 'af', rtl: true },
  { code: 'ro', name: 'Romanian', native: 'Română', flag: 'ro' },
  { code: 'sr', name: 'Serbian', native: 'Српски', flag: 'rs' },
  { code: 'sd', name: 'Sindhi', native: 'سنڌي', flag: 'pk', rtl: true },
  { code: 'si', name: 'Sinhala', native: 'සිංහල', flag: 'lk' },
  { code: 'sk', name: 'Slovak', native: 'Slovenčina', flag: 'sk' },
  { code: 'sl', name: 'Slovenian', native: 'Slovenščina', flag: 'si' },
  { code: 'so', name: 'Somali', native: 'Soomaali', flag: 'so' },
  { code: 'sv', name: 'Swedish', native: 'Svenska', flag: 'se' },
  { code: 'tg', name: 'Tajik', native: 'Тоҷикӣ', flag: 'tj' },
  { code: 'tk', name: 'Turkmen', native: 'Türkmen', flag: 'tm' },
  { code: 'ug', name: 'Uyghur', native: 'ئۇيغۇرچە', flag: 'cn', rtl: true },
  { code: 'uz', name: 'Uzbek', native: 'Oʻzbek', flag: 'uz' },
  { code: 'cy', name: 'Welsh', native: 'Cymraeg', flag: 'gb' },
  { code: 'xh', name: 'Xhosa', native: 'isiXhosa', flag: 'za' },
  { code: 'yo', name: 'Yoruba', native: 'Yorùbá', flag: 'ng' },
  { code: 'zu', name: 'Zulu', native: 'isiZulu', flag: 'za' }
];

export const LANG_BY_CODE = Object.fromEntries(LANGS.map((l) => [l.code, l]));
export const FEATURED = ['en', 'zh-CN', 'hi', 'es', 'ar', 'fr', 'pt', 'ru', 'ja', 'de', 'ko', 'id', 'tr', 'vi', 'bn'];

/** Best supported language for a BCP-47 tag (e.g. "zh-Hans-CN" -> "zh-CN"). */
export function matchLang(tag) {
  if (!tag) return null;
  const t = String(tag).trim();
  if (LANG_BY_CODE[t]) return t;
  const low = t.toLowerCase();
  if (low.startsWith('zh')) return /tw|hk|mo|hant/.test(low) ? 'zh-TW' : 'zh-CN';
  if (low === 'iw' || low.startsWith('iw-')) return 'he';
  if (low === 'tl' || low.startsWith('tl-')) return 'fil';
  if (low === 'nb' || low === 'nn' || low.startsWith('nb-')) return 'no';
  const base = low.split('-')[0];
  return LANGS.find((l) => l.code.toLowerCase() === base)?.code || null;
}
