/**
 * Optional layout for the consent route.
 * Keeps the page full-viewport and isolates styles.
 */
export const metadata = {
  title: 'Terms, Privacy Notice & Consent | MyFrequentRewards Business Professionals',
  description:
    'Review and accept the Business Professionals Panel terms, privacy notice and consents.',
  robots: { index: false, follow: false },
};

export default function ConsentLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', margin: 0, padding: 0 }}>
      {children}
    </div>
  );
}
