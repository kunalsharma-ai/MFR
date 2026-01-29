import "./globals.css";
import { CssBaseline } from "@mui/material";
import Providers from "./providers";
import { Toast } from "@/components";
import "@/lib/enhancements.js";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/FiraSans-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/FiraSans-Medium.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/FiraSans-SemiBold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/FiraSans-Bold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link rel="preload" href="/css/style.css" as="style" />
        <link rel="stylesheet" href="/css/style.css" />
        <title>My Frequent Rewards - Get Rewarded With Your Opinions</title>
        <meta
          name="description"
          content="Join My Frequent Rewards — a trusted platform where people share insights and earn rewards for participating in surveys."
        />
      </head>
      <body>
        <Providers>
          <CssBaseline />
          {children}
          <Toast />
        </Providers>
      </body>
    </html>
  );
}
