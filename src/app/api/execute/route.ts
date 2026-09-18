import { createHash } from "node:crypto";
import { z } from "zod";
import { executeJupiterOrder } from "@/lib/providers/jupiter";
import { type ReceiptPayload, openEnvelope, orderIntentSchema, sealEnvelope } from "@/lib/execution/envelope";
import { ExecutionError, executionErrorResponse } from "@/lib/execution/errors";
import { assertExecutionAuthorized, assertSameOrigin } from "@/lib/execution/gate";
import { runExecutionOnce } from "@/lib/execution/idempotency";
import { assertOrderNotExpired, simulatePreparedTransaction, validateSignedTransaction } from "@/lib/execution/transaction";
import { parseBoundedJson } from "@/lib/http/json";

export const runtime = "nodejs";
const schema = z.object({ wallet: z.string().min(32).max(64), intent: z.string().max(8_000), signedTransaction: z.string().max(2_500) });

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = await parseBoundedJson(request, schema, 16_000);
    const { wallet, secret } = assertExecutionAuthorized(input.wallet);
    const intent = openEnvelope(input.intent, orderIntentSchema, secret);
    if (intent.wallet !== wallet) throw new ExecutionError("wallet_changed", "The connected wallet changed after order review.", 409);
    if (intent.providerExpireAt && intent.providerExpireAt <= Date.now()) throw new ExecutionError("order_expired", "The reviewed Jupiter order expired.", 410);
    await assertOrderNotExpired(intent.lastValidBlockHeight);
    const validated = await validateSignedTransaction(input.signedTransaction, { wallet, messageHash: intent.transactionMessageHash });
    await simulatePreparedTransaction(validated.transaction);
    const submissionId = createHash("sha256").update(`${intent.orderRequestId}:${validated.signedTransactionHash}`).digest("hex");
    const result = await runExecutionOnce(submissionId, () => executeJupiterOrder({
      signedTransaction: input.signedTransaction,
      requestId: intent.orderRequestId,
      lastValidBlockHeight: intent.lastValidBlockHeight,
    }));
    if (result.status !== "Success" || !result.signature) {
      throw new ExecutionError("provider_failure", result.error || "Jupiter reported that execution failed.", 422, result.code === undefined ? undefined : String(result.code));
    }
    if (result.signature !== validated.signature) {
      throw new ExecutionError("execution_uncertain", "Jupiter returned a different signature than the wallet-signed transaction. Reconcile before retrying.", 502);
    }
    const now = Date.now();
    const receiptPayload: ReceiptPayload = {
      version: 1, kind: "receipt", wallet, signature: result.signature, inputMint: intent.inputMint, outputMint: intent.outputMint,
      inputAmount: intent.inputAmount, orderRequestId: intent.orderRequestId, issuedAt: now, expiresAt: now + 15 * 60_000,
    };
    return Response.json({ status: "submitted", signature: result.signature, slot: result.slot, submissionId, receiptToken: sealEnvelope(receiptPayload, secret), providerAmounts: {
      totalInputAmount: result.totalInputAmount, totalOutputAmount: result.totalOutputAmount,
    } }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return executionErrorResponse(error); }
}
