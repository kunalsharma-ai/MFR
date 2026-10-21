/**
 * Optional layout for the consent route.
 * Adds noindex metadata and basic head tags.
 * You can merge this into your root layout if preferred.
 */

export const metadata = {
  title: 'Your panel agreement — MyFrequentRewards',
  description:
    'MyFrequentRewards Consumer Panel Terms, Conditions, Privacy Notice and Consent — read in plain words, choose your permissions and confirm.',
  robots: { index: false, follow: false },
  themeColor: '#0b1e5b',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function ConsentLayout({ children }) {
  return children;
}
