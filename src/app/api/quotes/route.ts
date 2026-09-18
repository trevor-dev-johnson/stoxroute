import { NextResponse } from "next/server";
import { z } from "zod";
import { createComparisonRoundForAsset } from "@/lib/routing/round";
import { assetForTicker, SUPPORTED_TICKERS } from "@/lib/stocks/registry";
import { HttpRequestError, parseBoundedJson } from "@/lib/http/json";
import { checkQuoteRateLimit } from "@/lib/http/rate-limit";

export const runtime = "nodejs";

const requestSchema = z.object({ ticker: z.enum(SUPPORTED_TICKERS), amount: z.string().min(1).max(32) });

export async function POST(request: Request) {
  try {
    const limit = checkQuoteRateLimit(request);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "rate_limited", message: "Too many comparisons from this client. Try again shortly." },
        { status: 429, headers: { "cache-control": "no-store", "retry-after": String(limit.retryAfterSeconds), "x-ratelimit-remaining": "0" } },
      );
    }
    const input = await parseBoundedJson(request, requestSchema, 1_000);
    const asset = assetForTicker(input.ticker);
    if (!asset) throw new Error("Unsupported asset");
    const round = await createComparisonRoundForAsset(asset, input.amount);
    return NextResponse.json(round, { headers: { "cache-control": "no-store", "x-ratelimit-remaining": String(limit.remaining) } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Comparison failed";
    const invalid = error instanceof z.ZodError || error instanceof HttpRequestError || /amount|USDC/i.test(message);
    return NextResponse.json(
      { error: invalid ? "invalid_request" : "comparison_unavailable", message: invalid ? message : "Live comparison data is temporarily unavailable." },
      { status: error instanceof HttpRequestError ? error.status : invalid ? 400 : 503, headers: { "cache-control": "no-store" } },
    );
  }
}
