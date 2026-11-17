// Scan & Connect (v2.4) — every brand of the Frequent Research family with its website and social channels.
// Plain data, no imports: scripts/generate-qr.mjs reads this file to create one QR code per channel
// (public/images/qr/<brand>-<channel>.svg). After changing a URL here run `npm run qr` (the build runs it too).
//
// IMPORTANT — only real, verified links belong here. Channels with an empty `url` are NOT shown on the site.
// The sister-brand social profiles were not listed on their websites when this was built, so they are left empty
// for the team to fill in. The Frequent Research LinkedIn page was found by web search — please confirm it.
export const CONNECT_BRANDS = [
  {
    id: 'mfr',
    name: 'MyFrequentRewards',
    short: 'MFR',
    tagline: 'Paid surveys for consumers and professionals',
    note: 'This website — survey alerts, payout tips and member stories.',
    color: '#FF8A00',
    color2: '#FF3B8D',
    channels: [
      { id: 'website', label: 'Website', handle: 'myfrequentrewards.com', url: 'https://www.myfrequentrewards.com/', qr: '/images/qr/mfr-website.svg' },
      { id: 'youtube', label: 'YouTube', handle: '@MyFrequentRewards', url: 'https://www.youtube.com/@MyFrequentRewards', qr: '/images/qr/mfr-youtube.svg' },
      { id: 'facebook', label: 'Facebook', handle: '/myfrequentreswards', url: 'https://www.facebook.com/myfrequentreswards/', qr: '/images/qr/mfr-facebook.svg' },
      { id: 'instagram', label: 'Instagram', handle: '@myfrequentrewards', url: 'https://www.instagram.com/myfrequentrewards/', qr: '/images/qr/mfr-instagram.svg' },
      { id: 'linkedin', label: 'LinkedIn', handle: 'MyFrequentRewards', url: 'https://www.linkedin.com/company/myfrequentrewards', qr: '/images/qr/mfr-linkedin.svg' },
      { id: 'x', label: 'X', handle: '@MFR_Community', url: 'https://x.com/MFR_Community', qr: '/images/qr/mfr-x.svg' },
      { id: 'whatsapp', label: 'WhatsApp', handle: '+91 81782 00573', url: 'https://wa.me/918178200573', qr: '/images/qr/mfr-whatsapp.svg' },
    ],
  },
  {
    id: 't2o',
    name: 'Turn2Opinion',
    short: 'T2O',
    tagline: 'Online survey community by Frequent Research',
    note: 'Share your opinions on everyday topics and earn rewards.',
    color: '#14B8A6',
    color2: '#2F6BFF',
    channels: [
      { id: 'website', label: 'Website', handle: 'turn2opinion.com', url: 'https://www.turn2opinion.com/', qr: '/images/qr/t2o-website.svg' },
      { id: 'facebook', label: 'Facebook', handle: '', url: '', qr: '/images/qr/t2o-facebook.svg' },
      { id: 'instagram', label: 'Instagram', handle: '', url: '', qr: '/images/qr/t2o-instagram.svg' },
      { id: 'linkedin', label: 'LinkedIn', handle: '', url: '', qr: '/images/qr/t2o-linkedin.svg' },
      { id: 'youtube', label: 'YouTube', handle: '', url: '', qr: '/images/qr/t2o-youtube.svg' },
    ],
  },
  {
    id: 'mho',
    name: 'MyHealthOpinions',
    short: 'MHO',
    tagline: 'Health and medical opinion community',
    note: 'Health-related studies and surveys by Frequent Research.',
    color: '#E5484D',
    color2: '#8B5CF6',
    channels: [
      { id: 'website', label: 'Website', handle: 'myhealthopinions.com', url: 'https://www.myhealthopinions.com/', qr: '/images/qr/mho-website.svg' },
      { id: 'facebook', label: 'Facebook', handle: '', url: '', qr: '/images/qr/mho-facebook.svg' },
      { id: 'instagram', label: 'Instagram', handle: '', url: '', qr: '/images/qr/mho-instagram.svg' },
      { id: 'linkedin', label: 'LinkedIn', handle: '', url: '', qr: '/images/qr/mho-linkedin.svg' },
      { id: 'youtube', label: 'YouTube', handle: '', url: '', qr: '/images/qr/mho-youtube.svg' },
    ],
  },
  {
    id: 'fr',
    name: 'Frequent Research Fieldwork Solutions Pvt. Ltd.',
    short: 'FR',
    tagline: 'Market research and fieldwork — the company behind every brand here',
    note: 'ISO-certified research partner for agencies and brands worldwide.',
    color: '#1E3A8A',
    color2: '#14C9B5',
    channels: [
      { id: 'website', label: 'Website', handle: 'frequentresearch.com', url: 'https://www.frequentresearch.com/', qr: '/images/qr/fr-website.svg' },
      { id: 'linkedin', label: 'LinkedIn', handle: 'Frequent Research', url: 'https://www.linkedin.com/company/frequentresearch', qr: '/images/qr/fr-linkedin.svg' },
      { id: 'facebook', label: 'Facebook', handle: '', url: '', qr: '/images/qr/fr-facebook.svg' },
      { id: 'instagram', label: 'Instagram', handle: '', url: '', qr: '/images/qr/fr-instagram.svg' },
      { id: 'youtube', label: 'YouTube', handle: '', url: '', qr: '/images/qr/fr-youtube.svg' },
    ],
  },
];

// Channels that are ready to show (have a URL)
export const liveChannels = (brand) => brand.channels.filter((c) => c.url);
