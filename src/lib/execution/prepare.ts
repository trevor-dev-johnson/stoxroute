import { z } from "zod";
import { NVIDIA_CANDIDATES, USDC_MINT } from "@/lib/stocks/registry";
import { loadNvidiaMintStates } from "@/lib/solana/mint-state";
import { fetchTakerOrder } from "@/lib/providers/jupiter";
import { normalizeOutput, usdcToBaseUnits } from "@/lib/routing/normalize";
import { ExecutionError } from "@/lib/execution/errors";
import { type OrderIntent, sealEnvelope } from "@/lib/execution/envelope";
import { assertOrderNotExpired, inspectTransaction, simulatePreparedTransaction } from "@/lib/execution/transaction";

export const prepareOrderInputSchema = z.object({
  wallet: z.string().min(32).max(64),
  issuer: z.enum(["xStocks", "Ondo"]),
  symbol: z.enum(["NVDAx", "NVDAon"]),
  mint: z.string().min(32).max(64),
  amount: z.string().min(1).max(32),
  expectedExposure: z.string().regex(/^\d+(?:\.\d+)?$/),
  comparisonId: z.string().uuid(),
  comparisonQuoteRequestId: z.string().min(1).max(200),
  comparisonExpiresAt: z.string().datetime(),
  challengeToken: z.string().max(4_000),
  walletSignature: z.string().max(200),
});

export type PrepareOrderInput = z.infer<typeof prepareOrderInputSchema>;

export async function prepareExecutionOrder(input: PrepareOrderInput, secret: string, now = Date.now()) {
  if (Date.parse(input.comparisonExpiresAt) <= now) throw new ExecutionError("order_expired", "The selected comparison round is stale. Compare again before preparing an order.", 410);
  const candidateIndex = NVIDIA_CANDIDATES.findIndex((candidate) => candidate.mint === input.mint);
  const candidate = NVIDIA_CANDIDATES[candidateIndex];
  if (!candidate || candidate.issuer !== input.issuer || candidate.symbol !== input.symbol) {
    throw new ExecutionError("instrument_mismatch", "The selected issuer, symbol, and mint do not match the supported registry.", 400);
  }
  const inputAmount = usdcToBaseUnits(input.amount);
  const mintStates = await loadNvidiaMintStates(true);
  const mintState = mintStates[candidateIndex];
  if (!mintState || mintState.mint !== candidate.mint) throw new ExecutionError("instrument_mismatch", "Fresh mint state does not match the selected instrument.", 502);

  const order = await fetchTakerOrder(candidate, inputAmount, input.wallet);
  const expectedExposure = normalizeOutput(order.outAmount, mintState.decimals, mintState.multiplier);
  const minimumExposure = order.otherAmountThreshold ? normalizeOutput(order.otherAmountThreshold, mintState.decimals, mintState.multiplier) : undefined;
  await assertOrderNotExpired(order.lastValidBlockHeight);
  const inspection = await inspectTransaction(order.transaction, { wallet: input.wallet, inputMint: USDC_MINT, outputMint: candidate.mint });
  const simulation = await simulatePreparedTransaction(inspection.transaction);

  const expiresAt = Math.min(now + 30_000, order.providerExpireAt ?? Number.POSITIVE_INFINITY);
  if (!Number.isFinite(expiresAt) || expiresAt <= now + 2_000) throw new ExecutionError("order_expired", "The executable order expires too soon to review safely.", 410);
  const intentPayload: OrderIntent = {
    version: 1,
    kind: "order_intent",
    wallet: input.wallet,
    issuer: candidate.issuer,
    symbol: candidate.symbol,
    inputMint: USDC_MINT,
    outputMint: candidate.mint,
    inputAmount,
    expectedExposure,
    minimumExposure,
    comparisonId: input.comparisonId,
    comparisonQuoteRequestId: input.comparisonQuoteRequestId,
    orderRequestId: order.requestId,
    transactionMessageHash: inspection.messageHash,
    unsignedTransactionHash: inspection.transactionHash,
    lastValidBlockHeight: order.lastValidBlockHeight,
    providerExpireAt: order.providerExpireAt,
    router: order.router,
    issuedAt: now,
    expiresAt,
  };
  return {
    intent: sealEnvelope(intentPayload, secret),
    transaction: order.transaction,
    expiresAt,
    reviewChanged: input.expectedExposure !== expectedExposure,
    review: {
      wallet: input.wallet,
      issuer: candidate.issuer,
      symbol: candidate.symbol,
      mint: candidate.mint,
      requestedUsdc: input.amount,
      inputAmount,
      expectedExposure,
      minimumExposure,
      quoteRequestId: order.requestId,
      comparisonQuoteRequestId: input.comparisonQuoteRequestId,
      router: order.router,
      feeBps: order.feeBps,
      feeMint: order.feeMint,
      gasless: order.gasless,
      signatureFeeLamports: order.signatureFeeLamports,
      prioritizationFeeLamports: order.prioritizationFeeLamports,
      rentFeeLamports: order.rentFeeLamports,
      lastValidBlockHeight: order.lastValidBlockHeight,
      providerExpireAt: order.providerExpireAt,
      transaction: {
        messageHash: inspection.messageHash,
        signerCount: inspection.signerCount,
        instructionCount: inspection.instructionCount,
        accountCount: inspection.accountCount,
        programIds: inspection.programIds,
      },
      simulation,
    },
  };
}

export type PreparedExecutionOrder = Awaited<ReturnType<typeof prepareExecutionOrder>>;
