import { randomUUID } from "node:crypto";
import { SUPPORTED_ASSETS, type StockCandidate, type SupportedAsset } from "@/lib/stocks/registry";
import { loadAssetMintStates, type MintNormalizationState } from "@/lib/solana/mint-state";
import { fetchWalletlessQuote, type QuoteResult } from "@/lib/providers/jupiter";
import { compareExposure } from "@/lib/routing/compare";
import { normalizeOutput, usdcPerShareEquivalent, usdcToBaseUnits } from "@/lib/routing/normalize";
import { getExecutionStatus } from "@/lib/execution/gate";

const MAX_RESPONSE_SKEW_MS = 2_000;
const DISPLAY_WINDOW_MS = 30_000;

export type QuoteFetcher = (candidate: StockCandidate, inputBaseUnits: string) => Promise<QuoteResult>;

export async function fetchPairWithRetry(
  candidates: readonly [StockCandidate, StockCandidate],
  inputBaseUnits: string,
  quoteFetcher: QuoteFetcher = fetchWalletlessQuote,
  sleep: (milliseconds: number) => Promise<void> = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
): Promise<QuoteResult[]> {
  const fetchPair = () => Promise.all(candidates.map((candidate) => quoteFetcher(candidate, inputBaseUnits)));
  let quotes = await fetchPair();
  if (quotes.some((quote) => !quote.ok && quote.code === "rate_limited")) {
    const waitMs = Math.min(2_000, Math.max(...quotes.map((quote) => !quote.ok && quote.retryAfterMs ? quote.retryAfterMs : 0)));
    await sleep(waitMs);
    quotes = await fetchPair();
  }
  return quotes;
}

type RoundDependencies = {
  quoteFetcher?: QuoteFetcher;
  mintLoader?: (asset: SupportedAsset) => Promise<MintNormalizationState[]>;
  sleep?: (milliseconds: number) => Promise<void>;
  now?: () => number;
  createId?: () => string;
};

export async function createComparisonRoundForAsset(asset: SupportedAsset, requestedUsdc: string, dependencies: RoundDependencies = {}) {
  const now = dependencies.now ?? Date.now;
  const comparisonId = (dependencies.createId ?? randomUUID)();
  const inputBaseUnits = usdcToBaseUnits(requestedUsdc);
  const mintStates = await (dependencies.mintLoader ?? loadAssetMintStates)(asset);
  const quotes = await fetchPairWithRetry(asset.candidates, inputBaseUnits, dependencies.quoteFetcher, dependencies.sleep);

  const successfulFinishTimes = quotes.filter((quote) => quote.ok).map((quote) => quote.finishedAtMs);
  const responseSkewMs = successfulFinishTimes.length === 2 ? Math.abs(successfulFinishTimes[0] - successfulFinishTimes[1]) : null;
  const skewed = responseSkewMs !== null && responseSkewMs > MAX_RESPONSE_SKEW_MS;

  const candidates = asset.candidates.map((candidate, index) => {
    const quote = quotes[index];
    const state = mintStates[index];
    if (!quote.ok) return { issuer: candidate.issuer, symbol: candidate.symbol, mint: candidate.mint, status: "unavailable" as const, failure: quote };
    if (skewed) return { issuer: candidate.issuer, symbol: candidate.symbol, mint: candidate.mint, status: "stale_round" as const, failure: { code: "stale_round", message: "Quote responses were too far apart to compare" } };
    const exposure = normalizeOutput(quote.rawOutAmount, state.decimals, state.multiplier);
    const minimumExposure = quote.otherAmountThreshold
      ? normalizeOutput(quote.otherAmountThreshold, state.decimals, state.multiplier)
      : undefined;
    return {
      issuer: candidate.issuer,
      symbol: candidate.symbol,
      mint: candidate.mint,
      underlyingIsin: candidate.underlyingIsin,
      status: "available" as const,
      rawOutAmount: quote.rawOutAmount,
      exposure,
      minimumExposure,
      usdcPerShareEquivalent: usdcPerShareEquivalent(requestedUsdc, exposure),
      decimals: state.decimals,
      multiplier: state.multiplier,
      multiplierEffectiveTimestamp: state.multiplierConfig.newMultiplierEffectiveTimestamp,
      mintSlot: state.slot,
      normalizationFetchedAt: state.fetchedAt,
      normalizationCacheStatus: state.cacheStatus,
      quoteStartedAt: quote.startedAt,
      quoteFinishedAt: quote.finishedAt,
      router: quote.router,
      quoteRequestId: quote.quoteRequestId,
      fees: quote.fees,
    };
  });

  const available = candidates.filter((candidate) => candidate.status === "available");
  const comparison = available.length === 2
    ? compareExposure(
        { symbol: available[0].symbol, exposure: available[0].exposure },
        { symbol: available[1].symbol, exposure: available[1].exposure },
      )
    : null;

  const createdAtMs = now();
  return {
    comparisonId,
    ticker: asset.ticker,
    underlyingName: asset.underlyingName,
    underlyingIsin: asset.underlyingIsin,
    instrumentType: asset.instrumentType,
    requestedUsdc,
    inputBaseUnits,
    createdAt: new Date(createdAtMs).toISOString(),
    displayExpiresAt: new Date(createdAtMs + DISPLAY_WINDOW_MS).toISOString(),
    responseSkewMs,
    candidates,
    comparison,
    execution: getExecutionStatus(),
  };
}

export async function createComparisonRound(requestedUsdc: string) {
  return createComparisonRoundForAsset(SUPPORTED_ASSETS[0], requestedUsdc);
}

export type ComparisonRound = Awaited<ReturnType<typeof createComparisonRoundForAsset>>;
