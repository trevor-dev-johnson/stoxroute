import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpRequestError, parseBoundedJson } from "@/lib/http/json";
import { checkQuoteRateLimit } from "@/lib/http/rate-limit";
import { scanOpportunities } from "@/lib/routing/opportunities";
import { usdcToBaseUnits } from "@/lib/routing/normalize";
import { SUPPORTED_ASSETS } from "@/lib/stocks/registry";

export const runtime = "nodejs";

const requestSchema = z.object({ amount: z.string().min(1).max(32) });

export async function POST(request: Request) {
  try {
    const limit = checkQuoteRateLimit(request);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "rate_limited", message: "Too many scans from this client. Try again shortly." },
        { status: 429, headers: { "cache-control": "no-store", "retry-after": String(limit.retryAfterSeconds) } },
      );
    }
    const input = await parseBoundedJson(request, requestSchema, 1_000);
    usdcToBaseUnits(input.amount);
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const send = (value: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
        send({ type: "start", total: SUPPORTED_ASSETS.length });
        void scanOpportunities(input.amount, {
          onProgress(opportunity, completed, total) {
            send({ type: "asset", completed, total, opportunity });
          },
        }).then((scan) => {
          send({ type: "complete", scan });
          controller.close();
        }).catch(() => {
          send({ type: "error", message: "The live opportunity scan could not be completed." });
          controller.close();
        });
      },
    });
    return new Response(stream, {
      headers: {
        "content-type": "application/x-ndjson; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
        "x-ratelimit-remaining": String(limit.remaining),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    const invalid = error instanceof z.ZodError || error instanceof HttpRequestError || /amount|USDC/i.test(message);
    return NextResponse.json(
      { error: invalid ? "invalid_request" : "scan_unavailable", message: invalid ? message : "Live opportunity data is temporarily unavailable." },
      { status: error instanceof HttpRequestError ? error.status : invalid ? 400 : 503, headers: { "cache-control": "no-store" } },
    );
  }
}
