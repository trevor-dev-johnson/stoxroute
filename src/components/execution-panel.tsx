"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction } from "@solana/web3.js";
import type { ComparisonRound } from "@/lib/routing/round";
import type { PreparedExecutionOrder } from "@/lib/execution/prepare";
import { classifyExecutionFailure, type ExecutionFlowState } from "@/lib/execution/client-state";

type AvailableCandidate = Extract<ComparisonRound["candidates"][number], { status: "available" }>;
type Status = { enabled: boolean; configured: boolean; allowlistConfigured: boolean; testerRequired: boolean; reason: string };
type Receipt = { status: "confirming" | "failed" | "confirmed"; signature: string; slot?: string; error?: string; actualInputDebit?: string; actualOutputCredit?: string; explorerUrl?: string };

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}
function base64ToBytes(value: string): Uint8Array {
  const binary = window.atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
function short(value: string) { return `${value.slice(0, 6)}…${value.slice(-6)}`; }

const labels: Record<ExecutionFlowState, string> = {
  disconnected: "Wallet disconnected", connecting: "Connecting wallet", unavailable: "Tester required", ready: "Ready for tester review",
  authorizing: "Authorizing wallet", preparing: "Refreshing executable order", review: "Awaiting explicit signature", signing: "Wallet signature requested",
  rejected_signature: "Signature rejected", wrong_wallet: "Wallet changed", expired_order: "Order expired", insufficient_funds: "Insufficient funds",
  provider_failure: "Provider failure", simulation_failure: "Simulation failed", submitted: "Submitted", confirming: "Confirming onchain",
  failed: "Transaction failed", confirmed: "Confirmed",
};

export function ExecutionPanel({ round, candidate, stale }: { round: ComparisonRound | null; candidate: AvailableCandidate | null; stale: boolean }) {
  const { connected, connecting, publicKey, signMessage, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const [status, setStatus] = useState<Status | null>(null);
  const [flow, setFlow] = useState<ExecutionFlowState>("ready");
  const [message, setMessage] = useState("Select a route and prepare a fresh executable order.");
  const [prepared, setPrepared] = useState<PreparedExecutionOrder | null>(null);
  const [receiptToken, setReceiptToken] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [clock, setClock] = useState(0);

  useEffect(() => { fetch("/api/execution/status", { cache: "no-store" }).then((response) => response.json()).then(setStatus).catch(() => setStatus(null)); }, []);
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 1_000); return () => window.clearInterval(timer); }, []);
  const expired = prepared ? clock >= prepared.expiresAt : false;
  const walletChanged = Boolean(prepared && publicKey?.toBase58() !== prepared.review.wallet);
  const displayFlow: ExecutionFlowState = connecting
    ? "connecting"
    : !connected
      ? "disconnected"
      : status && (!status.enabled || !status.configured)
        ? "unavailable"
        : walletChanged
          ? "wrong_wallet"
          : flow;
  const displayMessage = displayFlow === "disconnected"
    ? "Connect a Wallet Standard wallet to begin a supervised review."
    : displayFlow === "connecting"
      ? "Waiting for the selected wallet to connect."
      : displayFlow === "unavailable"
        ? status?.reason ?? "Checking the server execution gate."
        : displayFlow === "wrong_wallet"
          ? "Reconnect the wallet used to prepare this order, or prepare a new one."
          : message;
  const busy = ["authorizing", "preparing", "signing", "submitted", "confirming"].includes(displayFlow);

  async function jsonRequest(url: string, body: unknown) {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json();
    if (!response.ok) throw { code: payload.error, message: payload.message };
    return payload;
  }

  async function prepare() {
    if (!round || !candidate || !publicKey || stale) return;
    if (!signMessage) { setFlow("provider_failure"); setMessage("This wallet does not support message signing required for tester authorization."); return; }
    const wallet = publicKey.toBase58();
    try {
      setFlow("authorizing"); setMessage("Approve the authorization message. It cannot move funds.");
      const challenge = await jsonRequest("/api/execution/challenge", { wallet });
      const signature = await signMessage(new TextEncoder().encode(challenge.message));
      setFlow("preparing"); setMessage("Refreshing mint state, route, transaction, and simulation.");
      const result = await jsonRequest("/api/order", {
        wallet, issuer: candidate.issuer, symbol: candidate.symbol, mint: candidate.mint, amount: round.requestedUsdc,
        expectedExposure: candidate.exposure, comparisonId: round.comparisonId, comparisonQuoteRequestId: candidate.quoteRequestId,
        comparisonExpiresAt: round.displayExpiresAt, challengeToken: challenge.token, walletSignature: bytesToBase64(signature),
      }) as PreparedExecutionOrder;
      setPrepared(result); setFlow("review");
      setMessage(result.reviewChanged ? "The executable order changed from the comparison. Review every value before signing." : "Fresh order validated and simulated. Review every value before signing.");
    } catch (error) { const next = classifyExecutionFailure(error); setFlow(next); setMessage(error instanceof Error ? error.message : (error as { message?: string }).message ?? "Order preparation failed."); }
  }

  async function refreshReceipt(token = receiptToken) {
    if (!token) return;
    try {
      setFlow("confirming");
      const next = await jsonRequest("/api/receipt", { receiptToken: token }) as Receipt;
      setReceipt(next); setFlow(next.status);
      setMessage(next.status === "confirmed" ? "Confirmed amounts below are computed from onchain wallet token-balance deltas." : next.status === "failed" ? "The confirmed transaction failed." : "The submitted signature is not confirmed yet.");
    } catch (error) { setFlow(classifyExecutionFailure(error)); setMessage((error as { message?: string }).message ?? "Receipt verification failed."); }
  }

  async function signAndExecute() {
    if (!prepared || !publicKey || !signTransaction) return;
    if (publicKey.toBase58() !== prepared.review.wallet) { setFlow("wrong_wallet"); return; }
    if (Date.now() >= prepared.expiresAt) { setFlow("expired_order"); setMessage("Prepare a fresh order before signing."); return; }
    try {
      setFlow("signing"); setMessage("Confirm the exact transaction in your wallet. No automatic approval is possible.");
      const transaction = VersionedTransaction.deserialize(base64ToBytes(prepared.transaction));
      const signed = await signTransaction(transaction);
      setFlow("submitted"); setMessage("Signed transaction is being sent through Jupiter’s managed execute flow.");
      const result = await jsonRequest("/api/execute", { wallet: publicKey.toBase58(), intent: prepared.intent, signedTransaction: bytesToBase64(signed.serialize()) });
      setReceiptToken(result.receiptToken); setReceipt({ status: "confirming", signature: result.signature });
      await refreshReceipt(result.receiptToken);
    } catch (error) { const next = classifyExecutionFailure(error); setFlow(next); setMessage((error as { message?: string }).message ?? "Execution failed."); }
  }

  return (
    <section className="execution" id="execution" aria-live="polite">
      <div className="execution__head"><div><p className="eyebrow">Supervised execution</p><h2>{candidate ? `Review ${candidate.symbol}` : "Select an issuer route"}</h2></div><span className={`execution-state execution-state--${displayFlow}`}>{labels[displayFlow]}</span></div>
      <div className="execution__body">
        <div className="execution__copy"><strong>{displayMessage}</strong><p>Comparison remains walletless. Signing is available only when the server gate, allowlist, wallet proof, fresh order, transaction validation, and simulation all pass.</p></div>
        {!connected ? <button className="execution__action" type="button" onClick={() => setVisible(true)}>Connect wallet</button>
          : !status?.enabled || !status.configured ? <button className="execution__action" type="button" disabled>Execution unavailable</button>
          : !prepared ? <button className="execution__action" type="button" disabled={!candidate || stale || busy} onClick={prepare}>{candidate ? "Prepare fresh order" : "Select a route above"}</button>
          : <button className="execution__action" type="button" disabled={busy || expired || displayFlow === "wrong_wallet"} onClick={signAndExecute}>{expired ? "Order expired" : "Sign reviewed transaction"}</button>}
      </div>
      {prepared && <div className="review-grid">
        <div><span>Wallet</span><strong>{short(prepared.review.wallet)}</strong></div><div><span>Instrument</span><strong>{prepared.review.issuer} · {prepared.review.symbol}</strong></div>
        <div><span>Exact input</span><strong>{prepared.review.requestedUsdc} USDC</strong></div><div><span>Expected exposure</span><strong>{prepared.review.expectedExposure}</strong></div>
        <div><span>Minimum exposure</span><strong>{prepared.review.minimumExposure ?? "Not supplied"}</strong></div><div><span>Router</span><strong>{prepared.review.router}</strong></div>
        <div><span>Order request</span><strong>{short(prepared.review.quoteRequestId)}</strong></div><div><span>Expires</span><strong>{expired ? "Expired" : new Date(prepared.expiresAt).toLocaleTimeString()}</strong></div>
        <div><span>Message hash</span><strong>{short(prepared.review.transaction.messageHash)}</strong></div><div><span>Simulation</span><strong>{prepared.review.simulation.ok ? "Passed" : "Failed"}</strong></div>
      </div>}
      {receipt && <div className="receipt">
        <div><p className="eyebrow">Transaction receipt</p><strong>{receipt.status === "confirmed" ? "Confirmed onchain" : receipt.status === "failed" ? "Failed" : "Awaiting confirmation"}</strong></div>
        <dl><div><dt>Signature</dt><dd>{short(receipt.signature)}</dd></div>{receipt.actualInputDebit && <div><dt>Actual USDC debit (base units)</dt><dd>{receipt.actualInputDebit}</dd></div>}{receipt.actualOutputCredit && <div><dt>Actual token credit (base units)</dt><dd>{receipt.actualOutputCredit}</dd></div>}</dl>
        {receipt.explorerUrl ? <a href={receipt.explorerUrl} target="_blank" rel="noreferrer">View confirmed transaction ↗</a> : receipt.status === "confirming" ? <button type="button" onClick={() => refreshReceipt()}>Check confirmation</button> : null}
      </div>}
    </section>
  );
}
