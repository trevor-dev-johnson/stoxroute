import { prepareExecutionOrder, prepareOrderInputSchema } from "@/lib/execution/prepare";
import { executionErrorResponse } from "@/lib/execution/errors";
import { assertBoundedRequest, assertExecutionAuthorized, assertSameOrigin } from "@/lib/execution/gate";
import { verifyWalletProof } from "@/lib/execution/wallet-proof";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertBoundedRequest(request);
    const origin = assertSameOrigin(request);
    const input = prepareOrderInputSchema.parse(await request.json());
    const { wallet, secret } = assertExecutionAuthorized(input.wallet);
    verifyWalletProof({ wallet, origin, challengeToken: input.challengeToken, signature: input.walletSignature, secret });
    const prepared = await prepareExecutionOrder({ ...input, wallet }, secret);
    return Response.json(prepared, { headers: { "cache-control": "no-store" } });
  } catch (error) { return executionErrorResponse(error); }
}
