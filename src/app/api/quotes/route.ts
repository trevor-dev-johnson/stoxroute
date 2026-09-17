import { NextResponse } from "next/server";
import { z } from "zod";
import { createComparisonRound } from "@/lib/routing/round";

export const runtime = "nodejs";

const requestSchema = z.object({ ticker: z.literal("NVDA"), amount: z.string().min(1).max(32) });

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    const round = await createComparisonRound(input.amount);
    return NextResponse.json(round, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Comparison failed";
    const invalid = error instanceof z.ZodError || /amount|USDC/i.test(message);
    return NextResponse.json(
      { error: invalid ? "invalid_request" : "comparison_unavailable", message: invalid ? message : "Live comparison data is temporarily unavailable." },
      { status: invalid ? 400 : 503, headers: { "cache-control": "no-store" } },
    );
  }
}
