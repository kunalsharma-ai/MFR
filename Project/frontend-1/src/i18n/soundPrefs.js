// Sound on/off preference and the description of each language's sound signature.
// Kept separate from sounds.js so the synthesiser (a larger file) can be lazy-loaded.
// v3.0: one sound switch for the whole site — the language picker, Live Help and the review studio share it.
import { setSound, soundOn } from '../utils/sound.js';

export function isSoundEnabled() {
  return soundOn();
}
export function setSoundEnabled(on) {
  setSound(on);
}

/** Short description of each sound (shown as the tooltip in the picker). */
export const SOUND_NAMES = {
  en: 'Bright synth sparkle', 'zh-CN': 'Guzheng glissando & gong', 'zh-TW': 'Erhu glide over pipa', ja: 'Koto & wind chimes', ko: 'Gayageum & janggu',
  hi: 'Sitar, tanpura & tabla', bn: 'Bansuri flute & ektara', ta: 'Veena & mridangam', te: 'Nadaswaram & thavil', mr: 'Dhol-tasha & harmonium',
  gu: 'Dandiya sticks & shehnai', pa: 'Bhangra dhol & tumbi', kn: 'Veena & ghatam', ml: 'Chenda roll & temple bell', ur: 'Qawwali harmonium & claps',
  ar: 'Oud in maqam Rast & darbuka', fa: 'Santur in dastgah Shur', he: 'Clarinet in freygish', tr: 'Bağlama & bendir', es: 'Flamenco guitar & castanets',
  pt: 'Bossa nova guitar', fr: 'Accordion musette', it: 'Mandolin tremolo', de: 'Brass fanfare & timpani', nl: 'Carillon bells',
  ru: 'Balalaika tremolo', uk: 'Bandura cascade', pl: 'Mazurka fiddle', sv: 'Nyckelharpa shimmer', nb: 'Lur horn & ice chimes',
  da: 'Music-box celesta', fi: 'Kantele cascade', el: 'Bouzouki tremolo', cs: 'Polka brass & clarinet', hu: 'Cimbalom run',
  ro: 'Nai pan flute doina', id: 'Gamelan & gong', ms: 'Kompang & rebab', th: 'Ranat xylophone & ching', vi: 'Đàn bầu monochord',
  fil: 'Kulintang gongs', sw: 'Kalimba & djembe',
  ne: 'Madal drum & bansuri', si: 'Geta bera drum & reed', km: 'Roneat xylophone & skor drum', bg: 'Gadulka in 7/8 & tapan',
  af: 'Concertina vastrap', zu: 'Marimba & isigubhu drum', am: 'Krar lyre in tizita', ha: 'Kakaki trumpet & talking drum', yo: 'Dùndún talking drum & shekere',
};

