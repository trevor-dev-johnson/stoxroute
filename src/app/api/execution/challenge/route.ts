import { z } from "zod";
import { createChallenge } from "@/lib/execution/envelope";
import { executionErrorResponse } from "@/lib/execution/errors";
import { assertExecutionAuthorized, assertSameOrigin } from "@/lib/execution/gate";
import { parseBoundedJson } from "@/lib/http/json";

export const runtime = "nodejs";
const schema = z.object({ wallet: z.string().min(32).max(64) });

export async function POST(request: Request) {
  try {
    const origin = assertSameOrigin(request);
    const input = await parseBoundedJson(request, schema, 1_000);
    const { wallet, secret } = assertExecutionAuthorized(input.wallet);
    return Response.json(createChallenge(wallet, origin, secret), { headers: { "cache-control": "no-store" } });
  } catch (error) { return executionErrorResponse(error); }
}
