import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wordle Solver",
  description:
    "Enter your guesses and the colors Wordle gave you, and see every word that can still be the answer.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#121213" },
  ],
};

// Pageview counting, off unless NEXT_PUBLIC_GOATCOUNTER_CODE names a GoatCounter
// site. The script sets no cookies and skips localhost, so dev runs stay uncounted.
const goatCounterCode = process.env.NEXT_PUBLIC_GOATCOUNTER_CODE;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        {children}
        {goatCounterCode ? (
          <Script
            src="https://gc.zgo.at/count.js"
            strategy="afterInteractive"
            data-goatcounter={`https://${goatCounterCode}.goatcounter.com/count`}
          />
        ) : null}
      </body>
    </html>
  );
}
