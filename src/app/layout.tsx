import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { SolanaWalletProvider } from "@/components/wallet-provider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  applicationName: "StoxRoute",
  title: { default: "StoxRoute — Compare tokenized NVIDIA routes", template: "%s · StoxRoute" },
  description: "Compare live NVDAx and NVDAon routes by normalized NVIDIA share-equivalent exposure on Solana—without connecting a wallet.",
  keywords: ["Solana", "tokenized stocks", "NVIDIA", "NVDAx", "NVDAon", "Jupiter"],
  authors: [{ name: "StoxRoute" }],
  creator: "StoxRoute",
  category: "finance",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg" },
  openGraph: {
    type: "website",
    siteName: "StoxRoute",
    title: "StoxRoute — Compare the exposure, not the token count",
    description: "Live, normalized comparison of tokenized NVIDIA routes on Solana.",
    images: [{ url: "/social-preview.png", width: 1200, height: 630, alt: "StoxRoute tokenized NVIDIA route comparison" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "StoxRoute — Compare tokenized NVIDIA routes",
    description: "Live, normalized comparison of NVDAx and NVDAon on Solana.",
    images: ["/social-preview.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><SolanaWalletProvider>{children}</SolanaWalletProvider></body>
    </html>
  );
}
