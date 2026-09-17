import { randomUUID } from "node:crypto";
import { NVIDIA_CANDIDATES } from "@/lib/stocks/registry";
import { loadNvidiaMintStates } from "@/lib/solana/mint-state";
import { fetchWalletlessQuote, type QuoteResult } from "@/lib/providers/jupiter";
import { compareExposure } from "@/lib/routing/compare";
import { normalizeOutput, usdcPerShareEquivalent, usdcToBaseUnits } from "@/lib/routing/normalize";
import { getExecutionStatus } from "@/lib/execution/gate";

const MAX_RESPONSE_SKEW_MS = 2_000;

async function fetchPair(inputBaseUnits: string): Promise<QuoteResult[]> {
  return Promise.all(NVIDIA_CANDIDATES.map((candidate) => fetchWalletlessQuote(candidate, inputBaseUnits)));
}

export async function createComparisonRound(requestedUsdc: string) {
  const comparisonId = randomUUID();
  const inputBaseUnits = usdcToBaseUnits(requestedUsdc);
  const mintStates = await loadNvidiaMintStates();

  let quotes = await fetchPair(inputBaseUnits);
  if (quotes.some((quote) => !quote.ok && quote.code === "rate_limited")) {
    const waitMs = Math.max(...quotes.map((quote) => !quote.ok && quote.retryAfterMs ? quote.retryAfterMs : 0));
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    quotes = await fetchPair(inputBaseUnits);
  }

  const successfulFinishTimes = quotes.filter((quote) => quote.ok).map((quote) => quote.finishedAtMs);
  const responseSkewMs = successfulFinishTimes.length === 2 ? Math.abs(successfulFinishTimes[0] - successfulFinishTimes[1]) : null;
  const skewed = responseSkewMs !== null && responseSkewMs > MAX_RESPONSE_SKEW_MS;

  const candidates = NVIDIA_CANDIDATES.map((candidate, index) => {
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
      isin: candidate.isin,
      status: "available" as const,
      rawOutAmount: quote.rawOutAmount,
      exposure,
      minimumExposure,
      usdcPerShareEquivalent: usdcPerShareEquivalent(requestedUsdc, exposure),
      decimals: state.decimals,
      multiplier: state.multiplier,
      multiplierEffectiveTimestamp: state.multiplierConfig.newMultiplierEffectiveTimestamp,
      mintSlot: state.slot,
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

  return {
    comparisonId,
    ticker: "NVDA",
    requestedUsdc,
    inputBaseUnits,
    createdAt: new Date().toISOString(),
    displayExpiresAt: new Date(Date.now() + 15_000).toISOString(),
    responseSkewMs,
    candidates,
    comparison,
    execution: getExecutionStatus(),
  };
}

export type ComparisonRound = Awaited<ReturnType<typeof createComparisonRound>>;
