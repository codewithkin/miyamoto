import type { Metadata } from "next";
import { Barlow_Condensed, DM_Sans, Zen_Old_Mincho } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers";

/**
 * The same three faces as the app: Zen Old Mincho for a Master's voice and
 * display type, DM Sans for everything else, Barlow Condensed for eyebrow
 * labels. Caveat is deliberately absent — the handwritten Bushido Code
 * belongs to the person who wrote it, not to marketing.
 */
const mincho = Zen_Old_Mincho({
  variable: "--font-mincho-loaded",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-sans-loaded",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const barlow = Barlow_Condensed({
  variable: "--font-condensed-loaded",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://miyamoto.app"),
  title: {
    default: "Miyamoto — Meet the Masters",
    template: "%s · Miyamoto",
  },
  description:
    "Bring a real problem. Musashi, Seneca, Mandela, Curie or Sun Tzu writes back with the moment from their own life that matched — and one thing for you to do today.",
  openGraph: {
    title: "Miyamoto — Meet the Masters",
    description: "Ask the people who survived worse.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The font variables go on <html>, not <body>: tokens.css reads them
    // from :root, and a custom property defined on body is invisible there.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${mincho.variable} ${dmSans.variable} ${barlow.variable}`}
    >
      <body style={{ margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
