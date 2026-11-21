// Scan & Connect (v3.0) — every brand of the Frequent Research family with its website and social channels.
// Plain data, no imports: scripts/generate-qr.mjs reads this file and writes one QR code per channel
// (public/images/qr/<brand>-<channel>.svg). After changing a URL here run `npm run qr`.
// All links were copied from the official Frequent Research website (Nov 2026). Channels with an empty `url`
// are not shown on the site.
export const CONNECT_BRANDS = [
  {
    id: 'mfr',
    name: 'MyFrequentRewards',
    short: 'MFR',
    tagline: 'Paid surveys for consumers, professionals and teens',
    note: 'This website — survey alerts, payout tips, member stories and the Teen Panel for 13–17s (opens with a parent or guardian’s consent).',
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
    tagline: 'Turn your opinion into rewards',
    note: 'Consumers and business professionals sharing views on everyday products and services.',
    color: '#1E5BFF',
    color2: '#22D3EE',
    channels: [
      { id: 'website', label: 'Website', handle: 'turn2opinion.com', url: 'https://www.turn2opinion.com/', qr: '/images/qr/t2o-website.svg' },
      { id: 'youtube', label: 'YouTube', handle: '@Turn2Opinion', url: 'https://www.youtube.com/@Turn2Opinion', qr: '/images/qr/t2o-youtube.svg' },
      { id: 'instagram', label: 'Instagram', handle: '@turn2opinion', url: 'https://www.instagram.com/turn2opinion/', qr: '/images/qr/t2o-instagram.svg' },
      { id: 'linkedin', label: 'LinkedIn', handle: 'Turn2Opinion', url: 'https://www.linkedin.com/company/turn2opinionpanel', qr: '/images/qr/t2o-linkedin.svg' },
      { id: 'facebook', label: 'Facebook', handle: '/tryturn2opinion', url: 'https://www.facebook.com/tryturn2opinion', qr: '/images/qr/t2o-facebook.svg' },
      { id: 'whatsapp', label: 'WhatsApp', handle: '+91 81782 00573', url: 'https://wa.me/918178200573', qr: '/images/qr/t2o-whatsapp.svg' },
    ],
  },
  {
    id: 'mho',
    name: 'MyHealthOpinions',
    short: 'MHO',
    tagline: 'Your experience can improve healthcare',
    note: 'Healthcare professionals, caregivers and patients sharing views that shape better care.',
    color: '#E5484D',
    color2: '#FF9F43',
    channels: [
      { id: 'website', label: 'Website', handle: 'myhealthopinions.com', url: 'https://www.myhealthopinions.com/', qr: '/images/qr/mho-website.svg' },
      { id: 'youtube', label: 'YouTube', handle: '@MyHealthOpinions', url: 'https://www.youtube.com/@MyHealthOpinions', qr: '/images/qr/mho-youtube.svg' },
      { id: 'instagram', label: 'Instagram', handle: '@myhealthopinions', url: 'https://www.instagram.com/myhealthopinions/', qr: '/images/qr/mho-instagram.svg' },
      { id: 'linkedin', label: 'LinkedIn', handle: 'MyHealthOpinions', url: 'https://www.linkedin.com/company/myhealthopinions/', qr: '/images/qr/mho-linkedin.svg' },
      { id: 'facebook', label: 'Facebook', handle: '/myhealthopinions', url: 'https://www.facebook.com/myhealthopinions/', qr: '/images/qr/mho-facebook.svg' },
      { id: 'whatsapp', label: 'WhatsApp', handle: '+91 81782 00573', url: 'https://wa.me/918178200573', qr: '/images/qr/mho-whatsapp.svg' },
    ],
  },
  {
    id: 'spl',
    name: 'Sampledge',
    short: 'SPL',
    tagline: 'Project and sample management DIY marketplace',
    note: 'The self-serve research tool from the Frequent Research family.',
    color: '#2F6BFF',
    color2: '#7B4DFF',
    channels: [
      { id: 'website', label: 'Website', handle: 'sampledge.com', url: 'https://www.sampledge.com/', qr: '/images/qr/spl-website.svg' },
      { id: 'youtube', label: 'YouTube', handle: '@Sampledge_DIY_Marketplace', url: 'https://www.youtube.com/@Sampledge_DIY_Marketplace', qr: '/images/qr/spl-youtube.svg' },
      { id: 'instagram', label: 'Instagram', handle: '@sampledge_diy', url: 'https://www.instagram.com/sampledge_diy/', qr: '/images/qr/spl-instagram.svg' },
      { id: 'threads', label: 'Threads', handle: '@sampledge_diy', url: 'https://www.threads.com/@sampledge_diy', qr: '/images/qr/spl-threads.svg' },
      { id: 'x', label: 'X', handle: '@SampledgeX', url: 'https://x.com/SampledgeX', qr: '/images/qr/spl-x.svg' },
      { id: 'linkedin', label: 'LinkedIn', handle: 'Sampledge DIY Marketplace', url: 'https://www.linkedin.com/company/sampledge-diy-marketplace', qr: '/images/qr/spl-linkedin.svg' },
      { id: 'facebook', label: 'Facebook', handle: 'Sampledge', url: 'https://www.facebook.com/people/Sampledge/61594616326502/', qr: '/images/qr/spl-facebook.svg' },
      { id: 'whatsapp', label: 'WhatsApp', handle: '+91 81782 00573', url: 'https://wa.me/918178200573', qr: '/images/qr/spl-whatsapp.svg' },
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
      { id: 'hub', label: 'Community hub', handle: 'All our survey communities', url: 'https://panels.frequentresearch.com/', qr: '/images/qr/fr-hub.svg' },
      { id: 'linkedin', label: 'LinkedIn', handle: 'Frequent Research', url: 'https://www.linkedin.com/company/frequentresearch', qr: '/images/qr/fr-linkedin.svg' },
      { id: 'youtube', label: 'YouTube', handle: '@frequentresearch', url: 'https://www.youtube.com/@frequentresearch', qr: '/images/qr/fr-youtube.svg' },
      { id: 'facebook', label: 'Facebook', handle: '/FrequentResearchFieldwork', url: 'https://www.facebook.com/FrequentResearchFieldwork', qr: '/images/qr/fr-facebook.svg' },
      { id: 'instagram', label: 'Instagram', handle: '@frequentresearchfield', url: 'https://www.instagram.com/frequentresearchfield', qr: '/images/qr/fr-instagram.svg' },
      { id: 'threads', label: 'Threads', handle: '@frequentresearchfield', url: 'https://www.threads.com/@frequentresearchfield', qr: '/images/qr/fr-threads.svg' },
      { id: 'x', label: 'X', handle: '@frequentrfs', url: 'https://x.com/frequentrfs', qr: '/images/qr/fr-x.svg' },
      { id: 'pinterest', label: 'Pinterest', handle: 'Frequent Research', url: 'https://pin.it/1ApfR1BQk', qr: '/images/qr/fr-pinterest.svg' },
      { id: 'google', label: 'Google', handle: 'Find us & leave a review', url: 'https://share.google/Q2u2ukm6YPPESkJTb', qr: '/images/qr/fr-google.svg' },
      { id: 'whatsapp', label: 'WhatsApp', handle: '+91 81782 00573', url: 'https://wa.me/918178200573', qr: '/images/qr/fr-whatsapp.svg' },
    ],
  },
];

// Channels that are ready to show (have a URL)
export const liveChannels = (brand) => brand.channels.filter((c) => c.url);
