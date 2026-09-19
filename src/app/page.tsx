"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Decimal from "decimal.js";
import { ScanForm } from "@/components/scan-form";
import type { AssetOpportunity, OpportunityScan } from "@/lib/routing/opportunities";
import { quoteImpliedDollarAdvantage, sortOpportunities } from "@/lib/routing/opportunities";
import type { ComparisonRound } from "@/lib/routing/round";
import { assetForTicker, SUPPORTED_ASSETS, type SupportedAsset } from "@/lib/stocks/registry";
import { assetSearchLabel, matchingSupportedAssets } from "@/lib/ui/asset-search";

type AvailableCandidate = Extract<ComparisonRound["candidates"][number], { status: "available" }>;
type SortMode = "bps" | "dollars";
type StreamEvent =
  | { type: "start"; total: number }
  | { type: "asset"; completed: number; total: number; opportunity: AssetOpportunity }
  | { type: "complete"; scan: OpportunityScan }
  | { type: "error"; message: string };

const FEATURED_ASSETS = SUPPORTED_ASSETS.filter((asset) => ["NVDA", "AAPL", "MSFT"].includes(asset.ticker));

function compact(value: string, places = 8) {
  try {
    const [whole, fraction] = new Decimal(value).toDecimalPlaces(places).toFixed().split(".");
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return fraction ? `${grouped}.${fraction}` : grouped;
  } catch { return value; }
}

function canonicalAmount(value: string) { return value.replace(/,/g, "").trim(); }
function formattedAmount(value: string) {
  const canonical = canonicalAmount(value);
  if (!canonical || !/^(?:0|[1-9]\d*)(?:\.\d{0,6})?$/.test(canonical)) return value;
  const [whole, fraction] = canonical.split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${fraction !== undefined ? `.${fraction}` : ""}`;
}
function money(value: string, places = 2) {
  const decimal = new Decimal(value);
  if (decimal.gt(0) && decimal.lt("0.01")) return "<$0.01";
  return `$${compact(decimal.toFixed(), places)}`;
}
function budget(value: string) { return `$${compact(canonicalAmount(value), 6)}`; }
function shortMint(mint: string) { return `${mint.slice(0, 6)}…${mint.slice(-6)}`; }
function exposureLabel(round: ComparisonRound) { return round.instrumentType === "etf" ? "normalized underlying exposure" : "normalized share-equivalent exposure"; }
function validAmount(value: string): string | null {
  const canonical = canonicalAmount(value);
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(canonical)) return "Enter a plain USDC amount with up to 6 decimals.";
  try { const amount = new Decimal(canonical); if (amount.lt(1) || amount.gt(10_000)) return "Amount must be between $1 and $10,000 USDC."; }
  catch { return "Enter a valid USDC amount."; }
  return null;
}

function AssetSelector({ query, selected, onQueryChange, onSelect }: { query: string; selected: SupportedAsset | null; onQueryChange: (value: string) => void; onSelect: (asset: SupportedAsset) => void }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const filtered = useMemo(() => matchingSupportedAssets(query, selected), [query, selected]);
  const choose = (asset: SupportedAsset) => { onSelect(asset); setOpen(false); setActiveIndex(0); };

  return <div className="asset-picker">
    <label htmlFor="asset-search">Choose a stock or ETF</label>
    <div className={`asset-combobox ${open ? "asset-combobox--open" : ""}`}>
      <span className="asset-combobox__search" aria-hidden>⌕</span>
      <input id="asset-search" role="combobox" aria-autocomplete="list" aria-controls="asset-options" aria-expanded={open} aria-activedescendant={open && filtered[activeIndex] ? `asset-option-${filtered[activeIndex].ticker}` : undefined} value={query} placeholder="Search NVDA, Apple, QQQ…" onFocus={() => setOpen(true)} onChange={(event) => { onQueryChange(event.target.value); setOpen(true); setActiveIndex(0); }} onKeyDown={(event) => {
        if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0))); }
        if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
        if (event.key === "Enter" && open && filtered[activeIndex]) { event.preventDefault(); choose(filtered[activeIndex]); }
        if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
      }} />
      {selected && <span className="asset-combobox__selected">Verified pair</span>}
      {open && <div id="asset-options" role="listbox" aria-label="Supported markets" className="asset-options">
        {filtered.length ? filtered.map((asset, index) => <button id={`asset-option-${asset.ticker}`} role="option" aria-selected={selected?.ticker === asset.ticker} className={index === activeIndex ? "asset-option asset-option--active" : "asset-option"} type="button" key={asset.ticker} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(asset)}>
          <span className="asset-option__ticker">{asset.ticker}</span><span><strong>{asset.underlyingName}</strong><small>{asset.instrumentType === "etf" ? "ETF" : "Stock"} · {asset.candidates.map((candidate) => candidate.issuer).join(" + ")}</small></span><span className="asset-option__status">Live pair supported</span>
        </button>) : <p className="asset-options__empty">No verified market matches “{query}”.</p>}
      </div>}
    </div>
    <p className="asset-picker__help">Only assets with complete, verified issuer-pair registry entries are selectable.</p>
  </div>;
}

function CandidateView({ candidate, round, winner, stale }: { candidate: ComparisonRound["candidates"][number]; round: ComparisonRound; winner: boolean; stale: boolean }) {
  const available = candidate.status === "available";
  const failureLabel = candidate.status !== "available" && candidate.failure.code === "rate_limited" ? "rate limited" : "unavailable";
  return <article className={`route ${winner && !stale ? "route--winner" : ""}`} aria-label={`${candidate.issuer} ${candidate.symbol}`}>
    <div className="route__head"><div><p className="eyebrow">{candidate.issuer}</p><h3>{candidate.symbol}</h3></div><span className={`status-dot ${available ? "status-dot--live" : "status-dot--error"}`}>{available ? (stale ? "stale" : winner ? "Best quoted route" : "available") : failureLabel}</span></div>
    {available ? <>
      <div className="route__number"><span>{compact(candidate.exposure)}</span><small>{exposureLabel(round)}</small></div>
      <dl className="route__metrics"><div><dt>Quote-based unit cost</dt><dd>{money(candidate.usdcPerShareEquivalent, 4)}</dd></div><div><dt>Router</dt><dd>{candidate.router}</dd></div><div><dt>Quoted fee</dt><dd>{candidate.fees.feeBps === undefined ? "Not supplied" : `${candidate.fees.feeBps} bps · included`}</dd></div><div><dt>Availability</dt><dd>{stale ? "Refresh required" : "Current quote"}</dd></div></dl>
      <details><summary>View route details</summary><dl className="details-grid"><div><dt>Underlying ISIN</dt><dd>{candidate.underlyingIsin}</dd></div><div><dt>Mint</dt><dd><a href={`https://solscan.io/token/${candidate.mint}`} target="_blank" rel="noreferrer">{shortMint(candidate.mint)} ↗</a></dd></div><div><dt>Raw output</dt><dd>{candidate.rawOutAmount}</dd></div><div><dt>Decimals</dt><dd>{candidate.decimals}</dd></div><div><dt>Active multiplier</dt><dd>{candidate.multiplier}</dd></div><div><dt>Mint slot</dt><dd>{candidate.mintSlot.toLocaleString()}</dd></div><div><dt>Normalization state</dt><dd>{candidate.normalizationCacheStatus} · {new Date(candidate.normalizationFetchedAt).toLocaleTimeString()}</dd></div><div><dt>Minimum exposure</dt><dd>{candidate.minimumExposure ? compact(candidate.minimumExposure) : "Not supplied"}</dd></div><div><dt>Gasless quote</dt><dd>{candidate.fees.gasless === undefined ? "Not supplied" : candidate.fees.gasless ? "Yes" : "No"}</dd></div><div><dt>Quote finished</dt><dd>{new Date(candidate.quoteFinishedAt).toLocaleTimeString()}</dd></div></dl></details>
    </> : <div className="route__failure"><span aria-hidden>—</span><p>{candidate.failure.message}</p><small>This issuer is {failureLabel}. A complete pair is required before StoxRoute can name a winner.</small></div>}
  </article>;
}

function OpportunityRow({ opportunity, now, selected, onSelect }: { opportunity: AssetOpportunity; now: number; selected: boolean; onSelect: (opportunity: AssetOpportunity) => void }) {
  const round = opportunity.round;
  const stale = round ? now > Date.parse(round.displayExpiresAt) : false;
  const age = round ? Math.max(0, Math.floor((now - Date.parse(round.createdAt)) / 1_000)) : null;
  const exposures = round?.candidates.map((candidate) => candidate.status === "available" ? `${candidate.symbol} ${compact(candidate.exposure, 6)}` : `${candidate.symbol} —`);
  const routers = round?.candidates.filter((candidate): candidate is AvailableCandidate => candidate.status === "available").map((candidate) => candidate.router);
  const status = stale ? "Stale" : opportunity.status === "complete" ? "Complete" : opportunity.status === "partial" ? "Partial" : "Unavailable";
  return <button className={`opportunity-row ${selected ? "opportunity-row--selected" : ""}`} type="button" onClick={() => onSelect(opportunity)}><span className="opportunity-row__asset"><strong>{opportunity.underlyingName}</strong><small>{opportunity.ticker} · {opportunity.instrumentType === "etf" ? "ETF" : "Stock"}</small></span><span><small>Winning issuer</small><strong>{opportunity.status === "complete" ? opportunity.winningIssuer ?? "Equal" : "—"}</strong></span><span><small>Normalized exposure</small><strong>{exposures?.join(" / ") ?? "No live routes"}</strong></span><span><small>Advantage</small><strong>{opportunity.status === "complete" && opportunity.advantageBps !== null ? `+${compact(opportunity.absoluteExposureAdvantage ?? "0", 6)} · ${compact(opportunity.advantageBps, 3)} bps` : "Not ranked"}</strong></span><span><small>Quote-implied difference</small><strong>{opportunity.status === "complete" && opportunity.quoteImpliedDollarAdvantage !== null ? money(opportunity.quoteImpliedDollarAdvantage) : "—"}</strong></span><span><small>Router</small><strong>{routers?.join(" / ") || "—"}</strong></span><span className={`opportunity-row__status opportunity-row__status--${opportunity.status}`}><small>{status}</small><strong>{age === null ? opportunity.message ?? "No result" : `${age}s old`}</strong></span></button>;
}

export default function Home() {
  const [amount, setAmount] = useState("1,000");
  const [assetQuery, setAssetQuery] = useState("");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [round, setRound] = useState<ComparisonRound | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [showBoard, setShowBoard] = useState(false);
  const [opportunities, setOpportunities] = useState<AssetOpportunity[]>([]);
  const [scan, setScan] = useState<OpportunityScan | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("bps");
  const [progress, setProgress] = useState<{ completed: number; total: number }>({ completed: 0, total: SUPPORTED_ASSETS.length });
  const [clock, setClock] = useState(0);
  const comparisonSequence = useRef(0);
  const scanSequence = useRef(0);
  const comparisonRequest = useRef<AbortController | null>(null);
  const scanRequest = useRef<AbortController | null>(null);

  useEffect(() => { const initial = window.setTimeout(() => setClock(Date.now()), 0); const timer = window.setInterval(() => setClock(Date.now()), 1_000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, []);
  const selectedAsset = selectedTicker ? assetForTicker(selectedTicker) ?? null : null;
  const sorted = useMemo(() => sortOpportunities(opportunities, sortMode), [opportunities, sortMode]);
  const stale = round ? clock > Date.parse(round.displayExpiresAt) : false;
  const age = round ? Math.max(0, Math.floor((clock - Date.parse(round.createdAt)) / 1_000)) : 0;
  const secondsLeft = round ? Math.max(0, Math.ceil((Date.parse(round.displayExpiresAt) - clock) / 1_000)) : 0;
  const availableCount = round?.candidates.filter((candidate) => candidate.status === "available").length ?? 0;
  const selectedValue = round ? quoteImpliedDollarAdvantage(round) : null;

  function clearComparison() { comparisonRequest.current?.abort(); comparisonRequest.current = null; comparisonSequence.current += 1; setRound(null); setComparisonError(null); setComparisonLoading(false); }
  function selectAsset(asset: SupportedAsset) { if (asset.ticker !== selectedTicker) clearComparison(); setSelectedTicker(asset.ticker); setAssetQuery(assetSearchLabel(asset)); setAmountError(null); }
  function changeAssetQuery(value: string) { if (selectedAsset && value !== assetSearchLabel(selectedAsset)) { clearComparison(); setSelectedTicker(null); setAmountError(null); } setAssetQuery(value); }
  function changeAmount(value: string) { setAmount(value.replace(/[^\d.,]/g, "")); setAmountError(null); clearComparison(); }

  async function runComparison(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault(); const invalid = validAmount(amount); setAmountError(invalid); if (!selectedAsset || invalid) return;
    const requestedUsdc = canonicalAmount(amount); const sequence = ++comparisonSequence.current; comparisonRequest.current?.abort(); const controller = new AbortController(); comparisonRequest.current = controller;
    setComparisonLoading(true); setComparisonError(null);
    try {
      const response = await fetch("/api/quotes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticker: selectedAsset.ticker, amount: requestedUsdc }), signal: controller.signal });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.message ?? "Live comparison failed"); if (sequence !== comparisonSequence.current) return;
      setRound(payload as ComparisonRound); setClock(Date.now()); window.setTimeout(() => document.getElementById("comparison-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    } catch (requestError) { if (sequence === comparisonSequence.current && !(requestError instanceof DOMException && requestError.name === "AbortError")) setComparisonError(requestError instanceof Error ? requestError.message : "Live comparison failed"); }
    finally { if (sequence === comparisonSequence.current) { setComparisonLoading(false); comparisonRequest.current = null; } }
  }

  async function runScan() {
    const invalid = validAmount(amount); setAmountError(invalid); if (invalid) return; setShowBoard(true);
    const sequence = ++scanSequence.current; scanRequest.current?.abort(); const controller = new AbortController(); scanRequest.current = controller;
    setScanLoading(true); setScanError(null); setScan(null); setOpportunities([]); setProgress({ completed: 0, total: SUPPORTED_ASSETS.length }); window.setTimeout(() => document.getElementById("market-scanner")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    try {
      const response = await fetch("/api/opportunities", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ amount: canonicalAmount(amount) }), signal: controller.signal });
      if (!response.ok) { const payload = await response.json(); throw new Error(payload.message ?? "Opportunity scan failed"); }
      if (!response.body) throw new Error("The scan stream was unavailable.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { done, value } = await reader.read(); buffer += decoder.decode(value, { stream: !done }); const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) { if (!line) continue; const update = JSON.parse(line) as StreamEvent; if (sequence !== scanSequence.current) return; if (update.type === "start") setProgress({ completed: 0, total: update.total }); if (update.type === "asset") { setProgress({ completed: update.completed, total: update.total }); setOpportunities((current) => [...current.filter((item) => item.ticker !== update.opportunity.ticker), update.opportunity]); } if (update.type === "complete") { setScan(update.scan); setOpportunities(update.scan.opportunities); } if (update.type === "error") throw new Error(update.message); }
        if (done) break;
      }
      setClock(Date.now());
    } catch (requestError) { if (sequence === scanSequence.current && !(requestError instanceof DOMException && requestError.name === "AbortError")) setScanError(requestError instanceof Error ? requestError.message : "Opportunity scan failed"); }
    finally { if (sequence === scanSequence.current) { setScanLoading(false); scanRequest.current = null; } }
  }

  function openOpportunity(opportunity: AssetOpportunity) {
    const asset = assetForTicker(opportunity.ticker); if (!asset) return;
    setSelectedTicker(asset.ticker); setAssetQuery(assetSearchLabel(asset)); setAmount(formattedAmount(opportunity.round?.requestedUsdc ?? amount)); setRound(opportunity.round); setComparisonError(null);
    setClock(Date.now());
    window.setTimeout(() => document.getElementById(opportunity.round ? "comparison-detail" : "comparison-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  const comparisonCopy = (() => {
    if (!round?.comparison) return null;
    if (round.comparison.label === "equal") return "Both routes returned equal quoted exposure.";
    const winner = round.candidates.find((candidate) => candidate.symbol === round.comparison?.winnerSymbol); const bps = compact(round.comparison.advantageBps, 3);
    return round.comparison.label === "nearly_equal" ? `Quotes are nearly equal. ${winner?.issuer} leads by ${bps} bps.` : `${winner?.issuer} delivers ${bps} bps more quoted exposure for this input.`;
  })();

  return <main>
    <header className="topbar"><a className="brand" href="#top" aria-label="StoxRoute home"><span className="brand__mark">SR</span>StoxRoute</a><div className="network"><span /> Solana mainnet</div></header>
    <section className="workspace" id="top">
      <div className="intro"><p className="eyebrow">Issuer-aware route comparison</p><h1>Compare tokenized<br />stock routes.</h1><p className="intro__copy">Choose a stock, set your USDC budget, and see which issuer delivers more normalized underlying exposure.</p></div>
      <section className="compare-workspace" id="comparison-form" aria-label="Compare tokenized stock routes">
        <AssetSelector query={assetQuery} selected={selectedAsset} onQueryChange={changeAssetQuery} onSelect={selectAsset} />
        <div className="featured-markets"><div className="section-kicker"><span>Featured markets</span><small>Curated from the verified registry—not a popularity ranking.</small></div><div className="featured-markets__grid">{FEATURED_ASSETS.map((asset) => <button type="button" key={asset.ticker} className={selectedTicker === asset.ticker ? "featured-market featured-market--selected" : "featured-market"} onClick={() => selectAsset(asset)}><span className="featured-market__ticker">{asset.ticker}</span><span className="featured-market__identity"><strong>{asset.underlyingName}</strong><small>{asset.instrumentType === "etf" ? "ETF" : "Stock"} · 2 issuers</small></span><span className="featured-market__state">Supported</span></button>)}</div></div>
        <ScanForm amount={amount} asset={selectedAsset} loading={comparisonLoading} invalidMessage={amountError} onAmountChange={changeAmount} onAmountBlur={() => setAmount(formattedAmount(amount))} onPreset={(value) => changeAmount(formattedAmount(value))} onSubmit={runComparison} />
        <button className="scan-all-action" type="button" disabled={scanLoading} onClick={() => void runScan()}>{scanLoading ? "Scanning supported markets…" : "Scan all supported markets"}<span aria-hidden>↘</span></button>
      </section>
      {comparisonError && <div className="notice notice--error" role="alert"><div><strong>Comparison unavailable</strong><span>{comparisonError}</span></div><button type="button" onClick={() => void runComparison()}>Retry comparison</button></div>}
      {!round && !comparisonLoading && <section className="comparison-empty" aria-live="polite"><span>01</span><div><p className="eyebrow">Ready when you are</p><h2>{selectedAsset ? `Compare ${selectedAsset.ticker} issuer routes` : "Choose a market to begin"}</h2><p>{selectedAsset ? `Set a USDC budget and request a fresh ${selectedAsset.underlyingName} comparison. No wallet is required.` : "Search by company name or ticker, or choose one of the verified featured markets above."}</p></div></section>}
      {comparisonLoading && !round && <section className="comparison-empty comparison-empty--loading" aria-live="polite"><span>↗</span><div><p className="eyebrow">Fetching fresh routes</p><h2>Comparing {selectedAsset?.ticker}</h2><p>Reading coherent Token-2022 multiplier state and current Jupiter quotes for both issuers.</p></div></section>}
      {round && <section className={`results ${comparisonLoading ? "results--loading" : ""}`} id="comparison-detail" aria-busy={comparisonLoading}>
        {comparisonLoading && <div className="scanline"><span /></div>}
        <div className="results__head"><div><p className="eyebrow">{round.ticker} route comparison</p><h2>Which {round.underlyingName} token gives you more exposure?</h2><p className="results__definition">{budget(round.requestedUsdc)} input · Normalized exposure applies each mint’s current decimals and Token-2022 multiplier. It is a comparison unit—not legal stock ownership.</p></div><div className={`freshness ${stale ? "freshness--stale" : ""}`}><span />{stale ? "Stale · refresh required" : `${secondsLeft}s live · ${age}s old`}</div></div>
        <div className="routes">{round.candidates.map((candidate) => <CandidateView key={candidate.symbol} candidate={candidate} round={round} stale={stale || comparisonLoading} winner={availableCount === 2 && round.comparison?.winnerSymbol === candidate.symbol} />)}</div>
        <div className={`verdict ${!round.comparison || stale ? "verdict--muted" : ""}`}><span className="verdict__glyph" aria-hidden>{round.comparison && !stale ? "↗" : "i"}</span><div><p className="eyebrow">{stale ? "Stale comparison" : round.comparison ? "Best quoted route" : "Complete pair required"}</p><strong>{stale ? "These quotes have passed the 30-second display window." : comparisonCopy ?? "One or both issuer routes are unavailable. No winner is declared."}</strong>{round.comparison && !stale ? <div className="verdict__facts"><span><b>+{compact(round.comparison.additionalExposure)}</b> normalized exposure</span><span><b>{selectedValue === null ? "—" : money(selectedValue)}</b> quote-implied difference</span><span><b>{compact(round.comparison.advantageBps, 3)} bps</b> relative advantage</span></div> : <p>Retry this asset without changing your selection or budget.</p>}<p>Estimates only. Issuer rights, liquidity, eligibility, jurisdiction, and final wallet costs can differ.</p></div><button type="button" onClick={() => void runComparison()} disabled={comparisonLoading}>{comparisonLoading ? "Refreshing…" : stale ? "Refresh comparison" : !round.comparison ? "Retry comparison" : "Refresh quotes"}</button></div>
      </section>}
      <aside className="risk-note" aria-label="Tokenized asset limitations"><p className="eyebrow">Important context</p><strong>Quotes estimate route output—not stock ownership or realized savings.</strong><p>Tokenized assets can differ by issuer rights, liquidity, eligibility, transfer restrictions, and jurisdiction. StoxRoute compares normalized quote output; it does not recommend an issuer or determine whether you may acquire a token.</p></aside>
      {showBoard && <section className={`opportunity-board ${scanLoading ? "opportunity-board--loading" : ""}`} id="market-scanner" aria-live="polite" aria-busy={scanLoading}>
        <div className="board-head"><div><p className="eyebrow">Secondary market scanner</p><h2>{scan ? `${budget(scan.requestedUsdc)} across ${scan.total} verified assets` : "Opportunity Board"}</h2><p>Rank complete issuer pairs across the registry. Partial and unavailable markets remain visible but unranked.</p></div><div className="board-controls" aria-label="Sort opportunity board"><button type="button" aria-pressed={sortMode === "bps"} onClick={() => setSortMode("bps")}>Basis points</button><button type="button" aria-pressed={sortMode === "dollars"} onClick={() => setSortMode("dollars")}>Dollar difference</button></div></div>
        {scanError && <div className="notice notice--error" role="alert"><div><strong>Scanner unavailable</strong><span>{scanError}</span></div><button type="button" onClick={() => void runScan()}>Retry scan</button></div>}
        {scanLoading && <div className="scan-progress"><span style={{ width: `${(progress.completed / progress.total) * 100}%` }} /><p>Scanning {progress.completed} of {progress.total} verified assets…</p></div>}
        {sorted.length ? <div className="opportunity-list">{sorted.map((opportunity) => <OpportunityRow key={opportunity.ticker} opportunity={opportunity} now={clock} selected={selectedTicker === opportunity.ticker} onSelect={openOpportunity} />)}</div> : <div className="empty-state"><div className="empty-state__axis"><span>NVDA</span><i /><span>TSLA</span><i /><span>SPY</span></div><p>{scanLoading ? "Reading coherent mint state and current Jupiter routes." : "Run the scan to compare all supported markets."}</p></div>}
        {scan && <p className="board-summary">{scan.completeCount} complete · {scan.partialCount} partial · {scan.unavailableCount} unavailable. Only complete pairs are ranked.</p>}
      </section>}
    </section>
    <footer><span>Trading execution is not currently available.</span><a href="https://github.com/trevor-dev-johnson/stoxroute" target="_blank" rel="noreferrer">GitHub ↗</a></footer>
  </main>;
}
