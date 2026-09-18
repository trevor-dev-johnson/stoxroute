import { prepareExecutionOrder, prepareOrderInputSchema } from "@/lib/execution/prepare";
import { executionErrorResponse } from "@/lib/execution/errors";
import { assertExecutionAuthorized, assertSameOrigin } from "@/lib/execution/gate";
import { verifyWalletProof } from "@/lib/execution/wallet-proof";
import { parseBoundedJson } from "@/lib/http/json";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const origin = assertSameOrigin(request);
    const input = await parseBoundedJson(request, prepareOrderInputSchema, 16_000);
    const { wallet, secret } = assertExecutionAuthorized(input.wallet);
    verifyWalletProof({ wallet, origin, challengeToken: input.challengeToken, signature: input.walletSignature, secret });
    const prepared = await prepareExecutionOrder({ ...input, wallet }, secret);
    return Response.json(prepared, { headers: { "cache-control": "no-store" } });
  } catch (error) { return executionErrorResponse(error); }
}
