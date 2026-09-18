import Decimal from "decimal.js";
import { SUPPORTED_ASSETS, type SupportedAsset } from "@/lib/stocks/registry";
import { usdcToBaseUnits } from "@/lib/routing/normalize";
import { createComparisonRoundForAsset, type ComparisonRound } from "@/lib/routing/round";

export const SCAN_CONCURRENCY = 1;

export type AssetOpportunity = {
  ticker: string;
  underlyingName: string;
  underlyingIsin: string;
  instrumentType: "stock" | "etf";
  status: "complete" | "partial" | "unavailable";
  round: ComparisonRound | null;
  winningIssuer: string | null;
  winnerSymbol: string | null;
  absoluteExposureAdvantage: string | null;
  advantageBps: string | null;
  quoteImpliedDollarAdvantage: string | null;
  message?: string;
};

export type OpportunityScan = {
  requestedUsdc: string;
  createdAt: string;
  total: number;
  completeCount: number;
  partialCount: number;
  unavailableCount: number;
  opportunities: AssetOpportunity[];
};

export function quoteImpliedDollarAdvantage(round: ComparisonRound): string | null {
  if (!round.comparison) return null;
  if (!round.comparison.winnerSymbol) return "0";
  const winner = round.candidates.find(
    (candidate) => candidate.status === "available" && candidate.symbol === round.comparison?.winnerSymbol,
  );
  if (!winner || winner.status !== "available") return null;
  return new Decimal(round.comparison.additionalExposure).mul(winner.usdcPerShareEquivalent).toFixed();
}

export function opportunityFromRound(round: ComparisonRound): AssetOpportunity {
  const availableCount = round.candidates.filter((candidate) => candidate.status === "available").length;
  const winner = round.comparison?.winnerSymbol
    ? round.candidates.find((candidate) => candidate.status === "available" && candidate.symbol === round.comparison?.winnerSymbol)
    : undefined;
  return {
    ticker: round.ticker,
    underlyingName: round.underlyingName,
    underlyingIsin: round.underlyingIsin,
    instrumentType: round.instrumentType,
    status: availableCount === 2 ? "complete" : availableCount === 1 ? "partial" : "unavailable",
    round,
    winningIssuer: winner?.issuer ?? null,
    winnerSymbol: round.comparison?.winnerSymbol ?? null,
    absoluteExposureAdvantage: round.comparison?.additionalExposure ?? null,
    advantageBps: round.comparison?.advantageBps ?? null,
    quoteImpliedDollarAdvantage: quoteImpliedDollarAdvantage(round),
  };
}

export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
  onComplete?: (result: R, index: number) => void | Promise<void>,
): Promise<R[]> {
  if (!Number.isInteger(limit) || limit < 1) throw new Error("Concurrency limit must be a positive integer");
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      const result = await worker(items[index], index);
      results[index] = result;
      await onComplete?.(result, index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runWorker()));
  return results;
}

export function sortOpportunities(opportunities: readonly AssetOpportunity[], sort: "bps" | "dollars" = "bps"): AssetOpportunity[] {
  const value = (opportunity: AssetOpportunity) => {
    if (opportunity.status !== "complete") return new Decimal(-1);
    const raw = sort === "bps" ? opportunity.advantageBps : opportunity.quoteImpliedDollarAdvantage;
    return raw === null ? new Decimal(-1) : new Decimal(raw);
  };
  return [...opportunities].sort((left, right) => {
    const compared = value(right).comparedTo(value(left));
    return compared || left.ticker.localeCompare(right.ticker);
  });
}

export function opportunityForTicker(opportunities: readonly AssetOpportunity[], ticker: string): AssetOpportunity | undefined {
  return opportunities.find((opportunity) => opportunity.ticker === ticker);
}

type ScanDependencies = {
  assets?: readonly SupportedAsset[];
  concurrency?: number;
  createRound?: (asset: SupportedAsset, amount: string) => Promise<ComparisonRound>;
  now?: () => number;
  onProgress?: (opportunity: AssetOpportunity, completed: number, total: number) => void | Promise<void>;
};

export async function scanOpportunities(requestedUsdc: string, dependencies: ScanDependencies = {}): Promise<OpportunityScan> {
  usdcToBaseUnits(requestedUsdc);
  const assets = dependencies.assets ?? SUPPORTED_ASSETS;
  const createRound = dependencies.createRound ?? createComparisonRoundForAsset;
  let completed = 0;
  const opportunities = await mapWithConcurrency(
    assets,
    dependencies.concurrency ?? SCAN_CONCURRENCY,
    async (asset) => {
      try {
        return opportunityFromRound(await createRound(asset, requestedUsdc));
      } catch (error) {
        return {
          ticker: asset.ticker,
          underlyingName: asset.underlyingName,
          underlyingIsin: asset.underlyingIsin,
          instrumentType: asset.instrumentType,
          status: "unavailable" as const,
          round: null,
          winningIssuer: null,
          winnerSymbol: null,
          absoluteExposureAdvantage: null,
          advantageBps: null,
          quoteImpliedDollarAdvantage: null,
          message: error instanceof Error ? error.message : "Live comparison unavailable",
        };
      }
    },
    async (opportunity) => {
      completed += 1;
      await dependencies.onProgress?.(opportunity, completed, assets.length);
    },
  );
  return {
    requestedUsdc,
    createdAt: new Date((dependencies.now ?? Date.now)()).toISOString(),
    total: assets.length,
    completeCount: opportunities.filter((opportunity) => opportunity.status === "complete").length,
    partialCount: opportunities.filter((opportunity) => opportunity.status === "partial").length,
    unavailableCount: opportunities.filter((opportunity) => opportunity.status === "unavailable").length,
    opportunities: sortOpportunities(opportunities),
  };
}
