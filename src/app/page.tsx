"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Decimal from "decimal.js";
import { WalletControl } from "@/components/wallet-control";
import { ExecutionPanel } from "@/components/execution-panel";
import { ScanForm } from "@/components/scan-form";
import type { AssetOpportunity, OpportunityScan } from "@/lib/routing/opportunities";
import { opportunityForTicker, sortOpportunities } from "@/lib/routing/opportunities";
import type { ComparisonRound } from "@/lib/routing/round";

type AvailableCandidate = Extract<ComparisonRound["candidates"][number], { status: "available" }>;
type SortMode = "bps" | "dollars";
type StreamEvent =
  | { type: "start"; total: number }
  | { type: "asset"; completed: number; total: number; opportunity: AssetOpportunity }
  | { type: "complete"; scan: OpportunityScan }
  | { type: "error"; message: string };

function compact(value: string, places = 8) {
  try {
    const [whole, fraction] = new Decimal(value).toDecimalPlaces(places).toFixed().split(".");
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return fraction ? `${grouped}.${fraction}` : grouped;
  } catch {
    return value;
  }
}

function money(value: string, places = 2) {
  const decimal = new Decimal(value);
  if (decimal.gt(0) && decimal.lt("0.01")) return "<$0.01";
  return `$${compact(decimal.toFixed(), places)}`;
}

function budget(value: string) { return `$${compact(value, 6)}`; }
function shortMint(mint: string) { return `${mint.slice(0, 6)}…${mint.slice(-6)}`; }
function exposureLabel(round: ComparisonRound) {
  return round.instrumentType === "etf" ? "normalized underlying exposure" : "normalized share-equivalent exposure";
}

function CandidateView({ candidate, round, winner, stale, selected, onReview }: {
  candidate: ComparisonRound["candidates"][number];
  round: ComparisonRound;
  winner: boolean;
  stale: boolean;
  selected: boolean;
  onReview: (candidate: AvailableCandidate) => void;
}) {
  const available = candidate.status === "available";
  return (
    <article className={`route ${winner && !stale ? "route--winner" : ""}`} aria-label={`${candidate.issuer} ${candidate.symbol}`}>
      <div className="route__head">
        <div><p className="eyebrow">{candidate.issuer}</p><h3>{candidate.symbol}</h3></div>
        <span className={`status-dot ${available ? "status-dot--live" : "status-dot--error"}`}>
          {available ? (stale ? "stale" : winner ? "leading quote" : "live") : "unavailable"}
        </span>
      </div>
      {available ? (
        <>
          <div className="route__number"><span>{compact(candidate.exposure)}</span><small>{exposureLabel(round)}</small></div>
          <dl className="route__metrics">
            <div><dt>Quote-based unit cost</dt><dd>{money(candidate.usdcPerShareEquivalent, 4)}</dd></div>
            <div><dt>Router</dt><dd>{candidate.router}</dd></div>
            <div><dt>Quoted fee</dt><dd>{candidate.fees.feeBps === undefined ? "Not supplied" : `${candidate.fees.feeBps} bps · included`}</dd></div>
          </dl>
          <details>
            <summary>Instrument details</summary>
            <dl className="details-grid">
              <div><dt>Underlying ISIN</dt><dd>{candidate.underlyingIsin}</dd></div>
              <div><dt>Mint</dt><dd><a href={`https://solscan.io/token/${candidate.mint}`} target="_blank" rel="noreferrer">{shortMint(candidate.mint)} ↗</a></dd></div>
              <div><dt>Raw output</dt><dd>{candidate.rawOutAmount}</dd></div>
              <div><dt>Decimals</dt><dd>{candidate.decimals}</dd></div>
              <div><dt>Active multiplier</dt><dd>{candidate.multiplier}</dd></div>
              <div><dt>Mint slot</dt><dd>{candidate.mintSlot.toLocaleString()}</dd></div>
              <div><dt>Normalization state</dt><dd>{candidate.normalizationCacheStatus} · {new Date(candidate.normalizationFetchedAt).toLocaleTimeString()}</dd></div>
              <div><dt>Minimum exposure</dt><dd>{candidate.minimumExposure ? compact(candidate.minimumExposure) : "Not supplied"}</dd></div>
              <div><dt>Gasless quote</dt><dd>{candidate.fees.gasless === undefined ? "Not supplied" : candidate.fees.gasless ? "Yes" : "No"}</dd></div>
              <div><dt>Quote finished</dt><dd>{new Date(candidate.quoteFinishedAt).toLocaleTimeString()}</dd></div>
            </dl>
          </details>
          <button className={`route__review ${selected ? "route__review--selected" : ""}`} type="button" disabled={stale} onClick={() => onReview(candidate)}>
            {selected ? "Selected for review" : `Review ${candidate.symbol}`}
          </button>
        </>
      ) : (
        <div className="route__failure"><span aria-hidden>—</span><p>{candidate.failure.message}</p><small>No cross-issuer winner can be declared from a partial round.</small></div>
      )}
    </article>
  );
}

function OpportunityRow({ opportunity, now, selected, onSelect }: {
  opportunity: AssetOpportunity;
  now: number;
  selected: boolean;
  onSelect: (opportunity: AssetOpportunity) => void;
}) {
  const round = opportunity.round;
  const stale = round ? now > Date.parse(round.displayExpiresAt) : false;
  const age = round ? Math.max(0, Math.floor((now - Date.parse(round.createdAt)) / 1_000)) : null;
  const exposures = round?.candidates.map((candidate) => candidate.status === "available" ? `${candidate.symbol} ${compact(candidate.exposure, 6)}` : `${candidate.symbol} —`);
  const routers = round?.candidates.filter((candidate): candidate is AvailableCandidate => candidate.status === "available").map((candidate) => candidate.router);
  const nearTie = round?.comparison?.label === "nearly_equal";
  const equal = round?.comparison?.label === "equal";
  const status = stale ? "Stale" : opportunity.status === "complete" ? nearTie ? "Near tie" : equal ? "Equal" : "Complete" : opportunity.status === "partial" ? "Partial" : "Unavailable";
  return (
    <button className={`opportunity-row ${selected ? "opportunity-row--selected" : ""}`} type="button" onClick={() => onSelect(opportunity)} disabled={!round}>
      <span className="opportunity-row__asset"><strong>{opportunity.underlyingName}</strong><small>{opportunity.ticker} · {opportunity.instrumentType === "etf" ? "ETF" : "Stock"}</small></span>
      <span><small>Winning issuer</small><strong>{opportunity.status === "complete" ? opportunity.winningIssuer ?? "Equal" : "—"}</strong></span>
      <span><small>Normalized exposure</small><strong>{exposures?.join(" / ") ?? "No live routes"}</strong></span>
      <span><small>Advantage</small><strong>{opportunity.status === "complete" && opportunity.advantageBps !== null ? `+${compact(opportunity.absoluteExposureAdvantage ?? "0", 6)} · ${compact(opportunity.advantageBps, 3)} bps` : "Not ranked"}</strong></span>
      <span><small>Quote-implied value</small><strong>{opportunity.status === "complete" && opportunity.quoteImpliedDollarAdvantage !== null ? money(opportunity.quoteImpliedDollarAdvantage) : "—"}</strong></span>
      <span><small>Router</small><strong>{routers?.join(" / ") || "—"}</strong></span>
      <span className={`opportunity-row__status opportunity-row__status--${opportunity.status}`}><small>{status}</small><strong>{age === null ? opportunity.message ?? "No result" : `${age}s old`}</strong></span>
    </button>
  );
}

function validAmount(value: string): string | null {
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(value)) return "Enter a plain USDC amount with up to 6 decimals.";
  try {
    const amount = new Decimal(value);
    if (amount.lt(1) || amount.gt(10_000)) return "Amount must be between $1 and $10,000 USDC.";
  } catch { return "Enter a valid USDC amount."; }
  return null;
}

export default function Home() {
  const [amount, setAmount] = useState("1000");
  const [opportunities, setOpportunities] = useState<AssetOpportunity[]>([]);
  const [scan, setScan] = useState<OpportunityScan | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("bps");
  const [progress, setProgress] = useState({ completed: 0, total: 3 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [clock, setClock] = useState(0);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [selectedMint, setSelectedMint] = useState<string | null>(null);
  const requestSequence = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 1_000); return () => window.clearInterval(timer); }, []);
  const sorted = useMemo(() => sortOpportunities(opportunities, sortMode), [opportunities, sortMode]);
  const selectedOpportunity = selectedTicker ? opportunityForTicker(opportunities, selectedTicker) : undefined;
  const round = selectedOpportunity?.round ?? null;
  const stale = round ? clock > Date.parse(round.displayExpiresAt) : false;
  const age = round ? Math.max(0, Math.floor((clock - Date.parse(round.createdAt)) / 1_000)) : 0;
  const availableCount = round?.candidates.filter((candidate) => candidate.status === "available").length ?? 0;
  const selectedCandidate = round?.candidates.find((candidate): candidate is AvailableCandidate => candidate.status === "available" && candidate.mint === selectedMint) ?? null;

  function selectOpportunity(opportunity: AssetOpportunity) {
    if (!opportunity.round) return;
    setSelectedTicker(opportunity.ticker);
    setSelectedMint(null);
    window.setTimeout(() => document.getElementById("comparison-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  async function runScan(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const invalid = validAmount(amount);
    setAmountError(invalid);
    if (invalid) return;
    const sequence = ++requestSequence.current;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true); setError(null); setScan(null); setOpportunities([]); setSelectedTicker(null); setSelectedMint(null); setProgress({ completed: 0, total: 3 });
    try {
      const response = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? "Opportunity scan failed");
      }
      if (!response.body) throw new Error("The scan stream was unavailable.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line) continue;
          const update = JSON.parse(line) as StreamEvent;
          if (sequence !== requestSequence.current) return;
          if (update.type === "start") setProgress({ completed: 0, total: update.total });
          if (update.type === "asset") {
            setProgress({ completed: update.completed, total: update.total });
            setOpportunities((current) => [...current.filter((item) => item.ticker !== update.opportunity.ticker), update.opportunity]);
          }
          if (update.type === "complete") {
            setScan(update.scan);
            setOpportunities(update.scan.opportunities);
            const first = update.scan.opportunities.find((item) => item.round);
            if (first) setSelectedTicker(first.ticker);
          }
          if (update.type === "error") throw new Error(update.message);
        }
        if (done) break;
      }
      setClock(Date.now());
    } catch (requestError) {
      if (sequence === requestSequence.current && !(requestError instanceof DOMException && requestError.name === "AbortError")) {
        setError(requestError instanceof Error ? requestError.message : "Opportunity scan failed");
      }
    } finally {
      if (sequence === requestSequence.current) { setLoading(false); activeRequest.current = null; }
    }
  }

  const comparisonCopy = (() => {
    if (!round?.comparison) return null;
    if (round.comparison.label === "equal") return "Both routes returned equal quoted exposure.";
    const winner = round.candidates.find((candidate) => candidate.symbol === round.comparison?.winnerSymbol);
    const bps = compact(round.comparison.advantageBps, 3);
    return round.comparison.label === "nearly_equal" ? `Quotes are nearly equal. ${winner?.issuer} leads by ${bps} bps.` : `${winner?.issuer} offers ${bps} bps more quoted exposure for this input.`;
  })();
  const selectedValue = selectedOpportunity?.quoteImpliedDollarAdvantage;

  return (
    <main>
      <header className="topbar"><a className="brand" href="#top" aria-label="StoxRoute home"><span className="brand__mark">SR</span>StoxRoute</a><div className="topbar__actions"><div className="network"><span /> Solana mainnet</div><WalletControl /></div></header>
      <section className="workspace" id="top">
        <div className="intro"><p className="eyebrow">Live tokenized-stock opportunity scanner</p><h1>One budget.<br />Every verified pair.</h1><p className="intro__copy">Scan competing issuer routes and rank where the same USDC budget receives the largest normalized underlying exposure.</p></div>
        <ScanForm amount={amount} loading={loading} invalidMessage={amountError} onAmountChange={(value) => { setAmount(value); setAmountError(null); }} onPreset={(value) => { setAmount(value); setAmountError(null); }} onSubmit={runScan} />
        <ol className="walkthrough" aria-label="How StoxRoute works">
          <li><span>01</span><div><strong>Set one budget</strong><small>The exact same USDC input is used for every verified pair.</small></div></li>
          <li><span>02</span><div><strong>Normalize each route</strong><small>Live outputs use current decimals and onchain multipliers.</small></div></li>
          <li><span>03</span><div><strong>Inspect, don’t assume</strong><small>Rank complete pairs, then review issuer, mint, freshness, and restrictions.</small></div></li>
        </ol>
        {error && <div className="notice notice--error" role="alert"><div><strong>Scan unavailable</strong><span>{error}</span></div><button type="button" onClick={() => void runScan()}>Try scan again</button></div>}

        <section className={`opportunity-board ${loading ? "opportunity-board--loading" : ""}`} aria-live="polite" aria-busy={loading}>
          <div className="board-head">
            <div><p className="eyebrow">Opportunity Board</p><h2>{scan ? `${budget(scan.requestedUsdc)} across ${scan.total} verified assets` : "Rank current issuer differences"}</h2></div>
            <div className="board-controls" aria-label="Sort opportunity board">
              <button type="button" aria-pressed={sortMode === "bps"} onClick={() => setSortMode("bps")}>Basis points</button>
              <button type="button" aria-pressed={sortMode === "dollars"} onClick={() => setSortMode("dollars")}>Dollar difference</button>
            </div>
          </div>
          {loading && <div className="scan-progress"><span style={{ width: `${(progress.completed / progress.total) * 100}%` }} /><p>Scanning {progress.completed} of {progress.total} verified assets…</p></div>}
          {sorted.length ? <div className="opportunity-list">{sorted.map((opportunity) => <OpportunityRow key={opportunity.ticker} opportunity={opportunity} now={clock} selected={selectedTicker === opportunity.ticker} onSelect={selectOpportunity} />)}</div>
            : <div className="empty-state"><div className="empty-state__axis"><span>NVDA</span><i /><span>TSLA</span><i /><span>SPY</span></div><p>{loading ? "Reading coherent mint state and current Jupiter routes." : "Enter one budget to scan all supported issuer pairs."}</p></div>}
          {scan && <p className="board-summary">{scan.completeCount} complete · {scan.partialCount} partial · {scan.unavailableCount} unavailable. Partial results are never ranked as winners.</p>}
        </section>

        {round && <section className="results" id="comparison-detail">
          <div className="results__head"><div><p className="eyebrow">Selected asset · {round.ticker}</p><h2>{budget(round.requestedUsdc)} → {round.underlyingName} exposure</h2><p className="results__definition">Normalized underlying exposure converts each quoted token output using that mint’s current decimals and Token-2022 multiplier. It is a comparison unit—not a claim that issuer rights are identical.</p></div><div className={`freshness ${stale ? "freshness--stale" : ""}`}><span />{stale ? "Refresh required" : `${age}s old`}</div></div>
          <div className="routes">{round.candidates.map((candidate) => <CandidateView key={candidate.symbol} candidate={candidate} round={round} stale={stale || loading} winner={availableCount === 2 && round.comparison?.winnerSymbol === candidate.symbol} selected={selectedMint === candidate.mint} onReview={(selected) => { setSelectedMint(selected.mint); window.setTimeout(() => document.getElementById("execution")?.scrollIntoView({ behavior: "smooth" }), 0); }} />)}</div>
          <div className={`verdict ${!round.comparison || stale ? "verdict--muted" : ""}`}><span className="verdict__glyph" aria-hidden>{round.comparison && !stale ? "↗" : "i"}</span><div><p className="eyebrow">{stale ? "Stale result" : round.comparison ? "Quoted exposure" : "Insufficient evidence"}</p><strong>{stale ? "These quotes have passed the 30-second display window." : comparisonCopy ?? "Only one route answered. A winner requires two current quotes."}</strong>{round.comparison && !stale ? <div className="verdict__facts"><span><b>+{compact(round.comparison.additionalExposure)}</b> normalized exposure</span><span><b>{selectedValue === null || selectedValue === undefined ? "—" : money(selectedValue)}</b> quote-implied value difference</span><span><b>{compact(round.comparison.advantageBps, 3)} bps</b> relative advantage</span></div> : <p>Run a fresh complete scan before drawing a route comparison.</p>}<p>Estimates only. Issuer rights, liquidity, eligibility, jurisdiction, and final wallet costs can differ.</p></div><button type="button" onClick={() => { if (stale || !round.comparison) { void runScan(); return; } const winner = round.candidates.find((candidate): candidate is AvailableCandidate => candidate.status === "available" && candidate.symbol === round.comparison?.winnerSymbol); if (winner) { setSelectedMint(winner.mint); window.setTimeout(() => document.getElementById("execution")?.scrollIntoView({ behavior: "smooth" }), 0); } }} disabled={loading}>{stale || !round.comparison ? "Refresh full scan" : "Review leading route"}</button></div>
        </section>}

        <aside className="risk-note" aria-label="Tokenized asset limitations"><p className="eyebrow">Before you compare</p><strong>Quotes estimate route output—not stock ownership, realized savings, or guaranteed execution.</strong><p>Tokenized assets can differ by issuer rights, liquidity, eligibility, transfer restrictions, and jurisdiction. StoxRoute compares normalized quote output; it does not recommend an issuer or determine whether you may acquire a token.</p></aside>
        <ExecutionPanel key={`${round?.comparisonId ?? "none"}:${selectedMint ?? "none"}`} round={round} candidate={selectedCandidate} stale={stale || loading} />
      </section>
      <footer><span>Live scanning works without a wallet.</span><span>Purchasing unavailable while the supervised execution gate is disabled.</span><a href="https://github.com/trevor-dev-johnson/stoxroute" target="_blank" rel="noreferrer">GitHub ↗</a></footer>
    </main>
  );
}
