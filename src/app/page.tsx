"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Decimal from "decimal.js";
import type { ComparisonRound } from "@/lib/routing/round";
import { WalletControl } from "@/components/wallet-control";
import { ExecutionPanel } from "@/components/execution-panel";

const PRESETS = ["100", "1000", "10000"];
type AvailableCandidate = Extract<ComparisonRound["candidates"][number], { status: "available" }>;

function compact(value: string, places = 8) {
  try {
    const [whole, fraction] = new Decimal(value).toDecimalPlaces(places).toFixed().split(".");
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return fraction ? `${grouped}.${fraction}` : grouped;
  } catch {
    return value;
  }
}

function money(value: string) { return `$${compact(value, 4)}`; }
function shortMint(mint: string) { return `${mint.slice(0, 6)}…${mint.slice(-6)}`; }

function quoteValueDifference(round: ComparisonRound): string | null {
  if (!round.comparison?.winnerSymbol) return round.comparison?.label === "equal" ? "$0.00" : null;
  const winner = round.candidates.find((candidate) => candidate.status === "available" && candidate.symbol === round.comparison?.winnerSymbol);
  if (!winner || winner.status !== "available") return null;
  const value = new Decimal(round.comparison.additionalExposure).mul(winner.usdcPerShareEquivalent);
  if (value.gt(0) && value.lt("0.01")) return "<$0.01";
  return `$${value.toDecimalPlaces(2).toFixed(2)}`;
}

function CandidateView({ candidate, winner, stale, selected, onReview }: { candidate: ComparisonRound["candidates"][number]; winner: boolean; stale: boolean; selected: boolean; onReview: (candidate: AvailableCandidate) => void }) {
  const available = candidate.status === "available";
  return (
    <article className={`route ${winner && !stale ? "route--winner" : ""}`} aria-label={`${candidate.issuer} ${candidate.symbol}`}>
      <div className="route__head">
        <div><p className="eyebrow">{candidate.issuer}</p><h3>{candidate.symbol}</h3></div>
        <span className={`status-dot ${available ? "status-dot--live" : "status-dot--error"}`}>{available ? (stale ? "stale" : winner ? "leading quote" : "live") : "unavailable"}</span>
      </div>
      {available ? (
        <>
          <div className="route__number"><span>{compact(candidate.exposure)}</span><small>NVIDIA share-equivalent</small></div>
          <dl className="route__metrics">
            <div><dt>Quote-based unit cost</dt><dd>{money(candidate.usdcPerShareEquivalent)}</dd></div>
            <div><dt>Router</dt><dd>{candidate.router}</dd></div>
            <div><dt>Quoted fee</dt><dd>{candidate.fees.feeBps === undefined ? "Not supplied" : `${candidate.fees.feeBps} bps · included`}</dd></div>
          </dl>
          <details>
            <summary>Instrument details</summary>
            <dl className="details-grid">
              <div><dt>Mint</dt><dd><a href={`https://solscan.io/token/${candidate.mint}`} target="_blank" rel="noreferrer">{shortMint(candidate.mint)} ↗</a></dd></div>
              <div><dt>Raw output</dt><dd>{candidate.rawOutAmount}</dd></div>
              <div><dt>Decimals</dt><dd>{candidate.decimals}</dd></div>
              <div><dt>Active multiplier</dt><dd>{candidate.multiplier}</dd></div>
              <div><dt>Mint slot</dt><dd>{candidate.mintSlot.toLocaleString()}</dd></div>
              <div><dt>Minimum exposure</dt><dd>{candidate.minimumExposure ? compact(candidate.minimumExposure) : "Not supplied"}</dd></div>
              <div><dt>Gasless quote</dt><dd>{candidate.fees.gasless === undefined ? "Not supplied" : candidate.fees.gasless ? "Yes" : "No"}</dd></div>
              <div><dt>Quote finished</dt><dd>{new Date(candidate.quoteFinishedAt).toLocaleTimeString()}</dd></div>
            </dl>
          </details>
          <button className={`route__review ${selected ? "route__review--selected" : ""}`} type="button" disabled={stale} onClick={() => onReview(candidate)}>{selected ? "Selected for review" : `Review ${candidate.symbol}`}</button>
        </>
      ) : (
        <div className="route__failure"><span aria-hidden>—</span><p>{candidate.failure.message}</p><small>No cross-issuer winner can be declared from a partial round.</small></div>
      )}
    </article>
  );
}

export default function Home() {
  const [amount, setAmount] = useState("1000");
  const [round, setRound] = useState<ComparisonRound | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState(0);
  const [selectedMint, setSelectedMint] = useState<string | null>(null);

  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 1_000); return () => window.clearInterval(timer); }, []);
  const stale = round ? clock > new Date(round.displayExpiresAt).getTime() : false;
  const age = round ? Math.max(0, Math.floor((clock - new Date(round.createdAt).getTime()) / 1_000)) : 0;
  const availableCount = round?.candidates.filter((candidate) => candidate.status === "available").length ?? 0;
  const selectedCandidate = round?.candidates.find((candidate): candidate is AvailableCandidate => candidate.status === "available" && candidate.mint === selectedMint) ?? null;
  const comparisonCopy = useMemo(() => {
    if (!round || !round.comparison) return null;
    if (round.comparison.label === "equal") return "Both routes returned equal quoted exposure.";
    const winner = round.candidates.find((candidate) => candidate.symbol === round.comparison?.winnerSymbol);
    const bps = compact(round.comparison.advantageBps, 3);
    return round.comparison.label === "nearly_equal" ? `Quotes are nearly equal. ${winner?.issuer} leads by ${bps} bps.` : `${winner?.issuer} offers ${bps} bps more quoted exposure for this input.`;
  }, [round]);
  const estimatedDifference = round ? quoteValueDifference(round) : null;

  async function compare(event?: FormEvent) {
    event?.preventDefault(); setLoading(true); setError(null);
    try {
      const response = await fetch("/api/quotes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticker: "NVDA", amount }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Comparison failed");
      setRound(payload as ComparisonRound); setSelectedMint(null); setClock(Date.now());
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Comparison failed"); }
    finally { setLoading(false); }
  }

  return (
    <main>
      <header className="topbar"><a className="brand" href="#top" aria-label="StoxRoute home"><span className="brand__mark">SR</span>StoxRoute</a><div className="topbar__actions"><div className="network"><span /> Solana mainnet</div><WalletControl /></div></header>
      <section className="workspace" id="top">
        <div className="intro"><p className="eyebrow">Live issuer comparison · NVIDIA</p><h1>Compare the exposure,<br />not the token count.</h1><p className="intro__copy">Equal USDC in. Current Jupiter quotes normalized with each mint’s live on-chain multiplier.</p></div>
        <ol className="walkthrough" aria-label="How StoxRoute works">
          <li><span>01</span><div><strong>Set one budget</strong><small>Choose the same exact USDC input for both routes.</small></div></li>
          <li><span>02</span><div><strong>Normalize exposure</strong><small>Live outputs are converted into NVIDIA share-equivalent exposure.</small></div></li>
          <li><span>03</span><div><strong>Inspect the route</strong><small>See issuer, mint, fees, freshness, and restrictions before any wallet step.</small></div></li>
        </ol>
        <form className="quote-form" onSubmit={compare} noValidate>
          <div className="asset-line"><div><span className="asset-symbol">NVDA</span><span>NVIDIA</span></div><span className="locked">Only enabled company</span></div>
          <label htmlFor="amount">USDC amount</label>
          <div className="amount-row"><div className="amount-field"><span>$</span><input id="amount" name="amount" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" aria-describedby="amount-help" /></div><button className="compare-button" type="submit" disabled={loading}>{loading ? "Comparing…" : "Compare routes"}<span aria-hidden>→</span></button></div>
          <div className="preset-row" id="amount-help"><span>Presets</span>{PRESETS.map((preset) => <button type="button" key={preset} className={amount === preset ? "active" : ""} onClick={() => setAmount(preset)}>${Number(preset).toLocaleString()}</button>)}<span className="range">Range $1–$10,000</span></div>
        </form>
        {error && <div className="notice notice--error" role="alert"><div><strong>Comparison unavailable</strong><span>{error}</span></div><button type="button" onClick={() => void compare()}>Try both routes again</button></div>}
        <section className={`results ${loading ? "results--loading" : ""}`} aria-live="polite" aria-busy={loading}>
          <div className="results__head"><div><p className="eyebrow">Comparison round</p><h2>{round ? `${round.requestedUsdc} USDC → NVIDIA exposure` : "Two representations. One budget."}</h2></div>{round && <div className={`freshness ${stale ? "freshness--stale" : ""}`}><span />{stale ? "Refresh required" : `${age}s old`}</div>}</div>
          {loading && <div className="scanline"><span /></div>}
          {round ? (
            <><div className="routes">{round.candidates.map((candidate) => <CandidateView key={candidate.symbol} candidate={candidate} stale={stale || loading} winner={!loading && availableCount === 2 && round.comparison?.winnerSymbol === candidate.symbol} selected={selectedMint === candidate.mint} onReview={(selected) => { setSelectedMint(selected.mint); window.setTimeout(() => document.getElementById("execution")?.scrollIntoView({ behavior: "smooth" }), 0); }} />)}</div>
            <div className={`verdict ${!round.comparison || stale ? "verdict--muted" : ""}`}><span className="verdict__glyph" aria-hidden>{round.comparison && !stale ? "↗" : "i"}</span><div><p className="eyebrow">{loading ? "Refreshing round" : stale ? "Stale result" : round.comparison ? "Quoted exposure" : "Insufficient evidence"}</p><strong>{loading ? "Prior results are stale while both routes refresh." : stale ? "These quotes have passed the 15-second display window." : comparisonCopy ?? "Only one route answered. A winner requires two current quotes."}</strong>{round.comparison && !stale ? <div className="verdict__facts"><span><b>+{compact(round.comparison.additionalExposure)}</b> share-equivalent</span><span><b>{estimatedDifference}</b> quote-implied value difference</span><span><b>{compact(round.comparison.advantageBps, 3)} bps</b> relative advantage</span></div> : <p>Refresh the complete pair before drawing a route comparison.</p>}<p>Estimates only. Issuer rights, liquidity, eligibility, jurisdiction, and final wallet costs can differ.</p></div><button type="button" onClick={() => { if (stale || !round.comparison) { void compare(); return; } const winner = round.candidates.find((candidate): candidate is AvailableCandidate => candidate.status === "available" && candidate.symbol === round.comparison?.winnerSymbol); if (winner) setSelectedMint(winner.mint); }} disabled={loading}>{stale || !round.comparison ? "Refresh both routes" : "Review leading route"}</button></div></>
          ) : <div className="empty-state"><div className="empty-state__axis"><span>NVDAx</span><i /><span>NVDAon</span></div><p>{loading ? "Fetching both issuer routes and current mint multipliers…" : "Run a comparison to fetch both routes in one current round."}</p></div>}
        </section>
        <aside className="risk-note" aria-label="Tokenized asset limitations"><p className="eyebrow">Before you compare</p><strong>Quotes estimate route output—not stock ownership or guaranteed execution.</strong><p>Tokenized assets can differ by issuer rights, liquidity, eligibility, transfer restrictions, and jurisdiction. StoxRoute compares normalized quote output; it does not recommend an issuer or determine whether you may acquire a token.</p></aside>
        <ExecutionPanel key={`${round?.comparisonId ?? "none"}:${selectedMint ?? "none"}`} round={round} candidate={selectedCandidate} stale={stale || loading} />
      </section>
      <footer><span>Live comparison works without a wallet.</span><span>Purchasing unavailable while the supervised execution gate is disabled.</span><a href="https://github.com/trevor-dev-johnson/stoxroute" target="_blank" rel="noreferrer">GitHub ↗</a></footer>
    </main>
  );
}
