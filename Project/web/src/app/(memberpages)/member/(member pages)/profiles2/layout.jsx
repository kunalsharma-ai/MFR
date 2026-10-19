import Script from "next/script";
import "./styles/app.css";

export const metadata = {
  title: "MyFrequentRewards · Member Profile Studio",
  description: "Multilingual member profile studio for MyFrequentRewards",
};

export default function ProfileLayout({ children }) {
  return (
    <>
      {/* Runtime config — edit public/config.js without rebuilding */}
      <Script src="/config.js" strategy="beforeInteractive" />
      {children}
    </>
  );
}
