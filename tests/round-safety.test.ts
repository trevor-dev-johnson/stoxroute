import { describe, expect, it, vi } from "vitest";
import { fetchPairWithRetry } from "../src/lib/routing/round";
import { assertPlausibleChainTime } from "../src/lib/solana/mint-state";
import { SUPPORTED_ASSETS } from "../src/lib/stocks/registry";
import type { QuoteResult } from "../src/lib/providers/jupiter";

const success = (id: string): QuoteResult => ({ ok: true, rawOutAmount: "1", router: "jupiterz", quoteRequestId: id, startedAt: new Date(0).toISOString(), finishedAt: new Date(1).toISOString(), finishedAtMs: 1, fees: {} });

describe("round provider safety", () => {
  it("requests only the two issuer routes for the selected asset", async () => {
    const selected = SUPPORTED_ASSETS.find((asset) => asset.ticker === "AAPL")!;
    const fetcher = vi.fn(async (candidate) => success(candidate.symbol));

    await fetchPairWithRetry(selected.candidates, "1000000000", fetcher);

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.map(([candidate]) => candidate.mint)).toEqual(
      selected.candidates.map((candidate) => candidate.mint),
    );
  });

  it("retries the whole pair once after a rate limit with bounded backoff", async () => {
    const responses: QuoteResult[] = [{ ok: false, code: "rate_limited", message: "limited", retryAfterMs: 9_000 }, success("old-sibling"), success("fresh-left"), success("fresh-right")];
    const fetcher = vi.fn(async () => responses.shift()!);
    const sleep = vi.fn(async () => undefined);
    const result = await fetchPairWithRetry(SUPPORTED_ASSETS[0].candidates, "1000000", fetcher, sleep);
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(sleep).toHaveBeenCalledWith(2_000);
    expect(result.map((quote) => quote.ok && quote.quoteRequestId)).toEqual(["fresh-left", "fresh-right"]);
  });

  it("does not loop when the retry is also rate limited", async () => {
    const limited: QuoteResult = { ok: false, code: "rate_limited", message: "limited", retryAfterMs: 10 };
    const fetcher = vi.fn(async () => limited);
    await fetchPairWithRetry(SUPPORTED_ASSETS[0].candidates, "1000000", fetcher, async () => undefined);
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("rejects stale and implausibly future chain time", () => {
    expect(() => assertPlausibleChainTime(879, 1_000)).toThrow(/stale or implausible/);
    expect(() => assertPlausibleChainTime(1_061, 1_000)).toThrow(/stale or implausible/);
    expect(() => assertPlausibleChainTime(900, 1_000)).not.toThrow();
  });
});
