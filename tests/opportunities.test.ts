import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { compareExposure } from "../src/lib/routing/compare";
import {
  mapWithConcurrency,
  opportunityForTicker,
  opportunityFromRound,
  quoteImpliedDollarAdvantage,
  scanOpportunities,
  sortOpportunities,
} from "../src/lib/routing/opportunities";
import type { ComparisonRound } from "../src/lib/routing/round";
import { SUPPORTED_ASSETS } from "../src/lib/stocks/registry";

function roundFor(index: number, left: string, right: string, partial = false): ComparisonRound {
  const asset = SUPPORTED_ASSETS[index];
  const comparison = partial ? null : compareExposure({ symbol: asset.candidates[0].symbol, exposure: left }, { symbol: asset.candidates[1].symbol, exposure: right });
  const candidate = (candidateIndex: number, exposure: string) => ({
    issuer: asset.candidates[candidateIndex].issuer,
    symbol: asset.candidates[candidateIndex].symbol,
    mint: asset.candidates[candidateIndex].mint,
    underlyingIsin: asset.underlyingIsin,
    status: "available" as const,
    rawOutAmount: "1",
    exposure,
    usdcPerShareEquivalent: new Decimal("1000").div(exposure).toFixed(),
    decimals: asset.candidates[candidateIndex].expectedDecimals,
    multiplier: "1",
    multiplierEffectiveTimestamp: 0,
    mintSlot: 1,
    normalizationFetchedAt: "2026-09-18T12:00:00.000Z",
    normalizationCacheStatus: "live" as const,
    quoteStartedAt: "2026-09-18T12:00:00.000Z",
    quoteFinishedAt: "2026-09-18T12:00:00.100Z",
    router: "jupiterz",
    quoteRequestId: `request-${candidateIndex}`,
    fees: {},
  });
  return {
    comparisonId: crypto.randomUUID(), ticker: asset.ticker, underlyingName: asset.underlyingName, underlyingIsin: asset.underlyingIsin,
    instrumentType: asset.instrumentType, requestedUsdc: "1000", inputBaseUnits: "1000000000", createdAt: "2026-09-18T12:00:00.000Z",
    displayExpiresAt: "2026-09-18T12:00:30.000Z", responseSkewMs: partial ? null : 100,
    candidates: partial ? [candidate(0, left), { issuer: asset.candidates[1].issuer, symbol: asset.candidates[1].symbol, mint: asset.candidates[1].mint, status: "unavailable", failure: { ok: false, code: "no_route", message: "No route" } }] : [candidate(0, left), candidate(1, right)],
    comparison, execution: { enabled: false, configured: false, allowlistConfigured: false, testerRequired: true, reason: "Execution unavailable" },
  } as ComparisonRound;
}

describe("multi-asset opportunity scanning", () => {
  it("ranks complete assets by basis points and dollar advantage", () => {
    const nvda = opportunityFromRound(roundFor(0, "10.02", "10"));
    const tsla = opportunityFromRound(roundFor(1, "10.01", "10"));
    expect(sortOpportunities([tsla, nvda]).map((item) => item.ticker)).toEqual(["NVDA", "TSLA"]);
    expect(Number(quoteImpliedDollarAdvantage(nvda.round!))).toBeCloseTo(1.996007984031936, 12);
    expect(sortOpportunities([tsla, nvda], "dollars")[0].ticker).toBe("NVDA");
  });

  it("labels near ties and never ranks a partial as a winner", () => {
    const near = opportunityFromRound(roundFor(0, "1.00004", "1"));
    const partial = opportunityFromRound(roundFor(1, "2", "1", true));
    expect(near.round?.comparison?.label).toBe("nearly_equal");
    expect(partial).toMatchObject({ status: "partial", winningIssuer: null, advantageBps: null });
    expect(sortOpportunities([partial, near])[0].ticker).toBe("NVDA");
  });

  it("isolates one asset failure and reports an entire scan failure honestly", async () => {
    const partialScan = await scanOpportunities("1000", { createRound: async (asset) => {
      if (asset.ticker === "TSLA") throw new Error("provider down");
      return roundFor(SUPPORTED_ASSETS.findIndex((candidate) => candidate.ticker === asset.ticker), "1.01", "1");
    } });
    expect(partialScan).toMatchObject({ completeCount: SUPPORTED_ASSETS.length - 1, unavailableCount: 1 });
    expect(opportunityForTicker(partialScan.opportunities, "TSLA")).toMatchObject({ status: "unavailable", message: "provider down" });

    const failed = await scanOpportunities("1000", { createRound: async () => { throw new Error("offline"); } });
    expect(failed).toMatchObject({ completeCount: 0, partialCount: 0, unavailableCount: SUPPORTED_ASSETS.length });
  });

  it("enforces the configured concurrency limit", async () => {
    let active = 0; let maximum = 0;
    await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (value) => {
      active += 1; maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1; return value;
    });
    expect(maximum).toBe(2);
  });

  it("selects a board asset and keeps routing code registry-driven", () => {
    const opportunities = [opportunityFromRound(roundFor(0, "1.01", "1")), opportunityFromRound(roundFor(2, "1.02", "1"))];
    expect(opportunityForTicker(opportunities, "SPY")?.underlyingName).toBe("SPDR S&P 500 ETF");
    const roundSource = readFileSync(resolve(process.cwd(), "src/lib/routing/round.ts"), "utf8");
    const pageSource = readFileSync(resolve(process.cwd(), "src/app/page.tsx"), "utf8");
    expect(roundSource).not.toContain("NVIDIA_CANDIDATES");
    expect(pageSource).not.toContain('ticker: "NVDA"');
  });
});
