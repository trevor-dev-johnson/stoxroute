import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { SolanaWalletProvider } from "@/components/wallet-provider";

export const metadata: Metadata = {
  title: "StoxRoute — Compare tokenized NVIDIA routes",
  description: "Compare current tokenized NVIDIA exposure across issuers on Solana.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><SolanaWalletProvider>{children}</SolanaWalletProvider></body>
    </html>
  );
}
