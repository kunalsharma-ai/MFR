import "./globals.css";

import { CssBaseline } from "@mui/material";
import Providers from "./providers";
import { Toast } from "@/components";
import "@/lib/enhancements.js";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/css/style.css" as="style" />
        <link rel="stylesheet" href="/css/style.css" />

        <title>My Frequent Rewards - Get Rewarded With Your Opinions</title>
        {/* <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap"
          rel="stylesheet"
        /> */}

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
        {/* <scrip src="/wasm_exec.js" /> */}
        {/* <call-us-selector
          phonesystem-url="https://1697.3cx.cloud"
          party="frequentresearch"
        ></call-us-selector>
        <script
          defer
          src="https://downloads-global.3cx.com/downloads/livechatandtalk/v1/callus.js"
          id="tcx-callus-js"
        ></script> */}
      </body>
    </html>
  );
}
