"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

function shortAddress(address: string) { return `${address.slice(0, 4)}…${address.slice(-4)}`; }

export function WalletControl() {
  const { connected, connecting, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  if (connecting) return <button className="wallet-control" type="button" disabled><span />Connecting…</button>;
  if (connected && publicKey) {
    return <button className="wallet-control wallet-control--connected" type="button" onClick={() => disconnect()} title="Disconnect wallet"><span />{shortAddress(publicKey.toBase58())}</button>;
  }
  return <button className="wallet-control" type="button" onClick={() => setVisible(true)}><span />Connect wallet</button>;
}
