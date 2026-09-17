import { z } from "zod";
import { createChallenge } from "@/lib/execution/envelope";
import { executionErrorResponse } from "@/lib/execution/errors";
import { assertBoundedRequest, assertExecutionAuthorized, assertSameOrigin } from "@/lib/execution/gate";

export const runtime = "nodejs";
const schema = z.object({ wallet: z.string().min(32).max(64) });

export async function POST(request: Request) {
  try {
    assertBoundedRequest(request);
    const origin = assertSameOrigin(request);
    const input = schema.parse(await request.json());
    const { wallet, secret } = assertExecutionAuthorized(input.wallet);
    return Response.json(createChallenge(wallet, origin, secret), { headers: { "cache-control": "no-store" } });
  } catch (error) { return executionErrorResponse(error); }
}
