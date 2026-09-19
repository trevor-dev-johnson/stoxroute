import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { SolanaWalletProvider } from "@/components/wallet-provider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  applicationName: "StoxRoute",
  title: { default: "StoxRoute — Compare tokenized stock routes", template: "%s · StoxRoute" },
  description: "Choose a supported stock and compare normalized issuer-route exposure from current Solana and Jupiter data—without connecting a wallet.",
  keywords: ["Solana", "tokenized stocks", "route comparison", "NVIDIA", "Tesla", "SPY", "Jupiter"],
  authors: [{ name: "StoxRoute" }],
  creator: "StoxRoute",
  category: "finance",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg" },
  openGraph: {
    type: "website",
    siteName: "StoxRoute",
    title: "StoxRoute — Compare the exposure, not the token count",
    description: "Choose a stock and compare live, normalized issuer-route exposure on Solana.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "StoxRoute tokenized-stock route comparison" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "StoxRoute — Compare tokenized stock routes",
    description: "Compare normalized issuer-route exposure across NVIDIA, Tesla, and SPY on Solana.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><SolanaWalletProvider>{children}</SolanaWalletProvider></body>
    </html>
  );
}
