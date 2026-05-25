import "./globals.css";
import { CssBaseline } from "@mui/material";
import Providers from "./providers";
import { Toast } from "@/components";
import "@/lib/enhancements.js";
import { GoogleTagManager } from "@next/third-parties/google";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/css/style.css" as="style" />
        <link rel="stylesheet" href="/css/style.css" />
        <title>
          My Frequent Rewards | Earn Rewards with Paid Online Surveys
        </title>
        <meta
          name="description"
          content="Join My Frequent Rewards and earn gift cards, cashback, and exciting rewards by participating in paid online surveys, opinion polls, and market research studies. "
        />
        <meta
          name="keywords"
          content="paid online surveys, 
          earn rewards online, 
          gift card rewards, 
          online survey rewards, 
          survey rewards platform, 
          earn cashback online, 
          online opinion surveys, 
          paid survey community, 
          market research rewards, 
          consumer rewards platform, 
          survey panel India, 
          online earning platform, 
          gift voucher surveys, 
          survey cashback rewards, 
          earn money from surveys, 
          trusted survey websites, 
          reward points platform, 
          paid consumer surveys, 
          survey incentive platform, 
          online rewards community "
        />
      </head>
      <body>
        <Providers>
          <CssBaseline />
          {children}
          <Toast />
        </Providers>
        <GoogleTagManager gtmId="GTM-WG9FZ9LK" />
      </body>
    </html>
  );
}
