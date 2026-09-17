import { z } from "zod";
import { USDC_MINT, type StockCandidate } from "@/lib/stocks/registry";
import { ExecutionError } from "@/lib/execution/errors";

const JUPITER_ORDER_URL = "https://api.jup.ag/swap/v2/order";

const amountSchema = z.string().regex(/^\d+$/).refine((value) => BigInt(value) > BigInt(0));
const quoteSchema = z.object({
  inAmount: amountSchema,
  outAmount: amountSchema,
  otherAmountThreshold: amountSchema.optional(),
  swapMode: z.literal("ExactIn"),
  inputMint: z.string(),
  outputMint: z.string(),
  router: z.string().min(1),
  requestId: z.string().min(1),
  feeMint: z.string().optional(),
  feeBps: z.number().finite().optional(),
  platformFee: z.object({
    feeBps: z.number().finite().optional(),
    feeMint: z.string().optional(),
    amount: z.union([z.string(), z.number()]).transform(String).optional(),
  }).nullable().optional(),
  signatureFeeLamports: z.number().finite().optional(),
  prioritizationFeeLamports: z.number().finite().optional(),
  rentFeeLamports: z.number().finite().optional(),
  gasless: z.boolean().optional(),
  errorCode: z.union([z.string(), z.number()]).nullable().optional(),
  errorMessage: z.string().nullable().optional(),
}).passthrough();

export type QuoteFailureCode = "rate_limited" | "timeout" | "no_route" | "provider_error" | "malformed_response";

export type QuoteSuccess = {
  ok: true;
  rawOutAmount: string;
  otherAmountThreshold?: string;
  router: string;
  quoteRequestId: string;
  startedAt: string;
  finishedAt: string;
  finishedAtMs: number;
  fees: {
    feeMint?: string;
    feeBps?: number;
    platformFeeBps?: number;
    platformFeeAmount?: string;
    signatureFeeLamports?: number;
    prioritizationFeeLamports?: number;
    rentFeeLamports?: number;
    gasless?: boolean;
  };
};

export type QuoteFailure = { ok: false; code: QuoteFailureCode; message: string; retryAfterMs?: number };
export type QuoteResult = QuoteSuccess | QuoteFailure;

function failureFromStatus(status: number, retryAfter: string | null): QuoteFailure {
  if (status === 429) {
    const seconds = retryAfter ? Number(retryAfter) : Number.NaN;
    return { ok: false, code: "rate_limited", message: "Jupiter is rate limiting this comparison", retryAfterMs: Number.isFinite(seconds) ? Math.min(seconds * 1000, 2_000) : 750 };
  }
  if (status === 404) return { ok: false, code: "no_route", message: "No route was available for this token" };
  return { ok: false, code: "provider_error", message: `Jupiter returned HTTP ${status}` };
}

export async function fetchWalletlessQuote(candidate: StockCandidate, inputAmount: string): Promise<QuoteResult> {
  const startedAtMs = Date.now();
  const url = new URL(JUPITER_ORDER_URL);
  url.searchParams.set("inputMint", USDC_MINT);
  url.searchParams.set("outputMint", candidate.mint);
  url.searchParams.set("amount", inputAmount);
  const headers: HeadersInit = { accept: "application/json" };
  if (process.env.JUPITER_API_KEY) headers["x-api-key"] = process.env.JUPITER_API_KEY;

  try {
    const response = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return failureFromStatus(response.status, response.headers.get("retry-after"));
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return { ok: false, code: "malformed_response", message: "Jupiter returned malformed JSON" };
    }
    const parsed = quoteSchema.safeParse(body);
    if (!parsed.success) return { ok: false, code: "malformed_response", message: "Jupiter quote fields were incomplete" };
    const quote = parsed.data;
    if (quote.errorCode !== undefined && quote.errorCode !== null || quote.errorMessage) {
      const text = quote.errorMessage ?? `Provider error ${quote.errorCode}`;
      return { ok: false, code: /route/i.test(text) ? "no_route" : "provider_error", message: text };
    }
    if (quote.inputMint !== USDC_MINT || quote.outputMint !== candidate.mint || quote.inAmount !== inputAmount) {
      return { ok: false, code: "malformed_response", message: "Jupiter returned mismatched quote intent" };
    }
    const finishedAtMs = Date.now();
    return {
      ok: true,
      rawOutAmount: quote.outAmount,
      otherAmountThreshold: quote.otherAmountThreshold,
      router: quote.router,
      quoteRequestId: quote.requestId,
      startedAt: new Date(startedAtMs).toISOString(),
      finishedAt: new Date(finishedAtMs).toISOString(),
      finishedAtMs,
      fees: {
        feeMint: quote.feeMint,
        feeBps: quote.feeBps,
        platformFeeBps: quote.platformFee?.feeBps,
        platformFeeAmount: quote.platformFee?.amount,
        signatureFeeLamports: quote.signatureFeeLamports,
        prioritizationFeeLamports: quote.prioritizationFeeLamports,
        rentFeeLamports: quote.rentFeeLamports,
        gasless: quote.gasless,
      },
    };
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return { ok: false, code: "timeout", message: "Jupiter did not respond within 8 seconds" };
    }
    return { ok: false, code: "provider_error", message: "Jupiter could not be reached" };
  }
}

const takerOrderSchema = quoteSchema.extend({
  transaction: z.string(),
  taker: z.string(),
  lastValidBlockHeight: z.union([z.string(), z.number()]).transform(String).optional(),
  expireAt: z.union([z.string(), z.number()]).transform(String).optional(),
  quoteId: z.string().optional(),
  maker: z.string().optional(),
  mode: z.string().optional(),
});

const executeResponseSchema = z.object({
  status: z.enum(["Success", "Failed"]),
  signature: z.string().optional(),
  slot: z.union([z.string(), z.number()]).transform(String).optional(),
  error: z.string().optional(),
  code: z.number().optional(),
  totalInputAmount: z.string().optional(),
  totalOutputAmount: z.string().optional(),
  inputAmountResult: z.string().optional(),
  outputAmountResult: z.string().optional(),
}).passthrough();

export type TakerOrder = z.infer<typeof takerOrderSchema>;
export type JupiterExecutionResult = z.infer<typeof executeResponseSchema>;

function providerHeaders(contentType = false): HeadersInit {
  const key = process.env.JUPITER_API_KEY;
  if (!key) throw new ExecutionError("execution_misconfigured", "A Jupiter API key is required for supervised execution.", 503);
  return { accept: "application/json", "x-api-key": key, ...(contentType ? { "content-type": "application/json" } : {}) };
}

function providerExpiry(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric > 10_000_000_000 ? numeric : numeric * 1000;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function fetchTakerOrder(candidate: StockCandidate, inputAmount: string, wallet: string): Promise<TakerOrder & { providerExpireAt?: number }> {
  const url = new URL(JUPITER_ORDER_URL);
  url.searchParams.set("inputMint", USDC_MINT);
  url.searchParams.set("outputMint", candidate.mint);
  url.searchParams.set("amount", inputAmount);
  url.searchParams.set("taker", wallet);
  let response: Response;
  try {
    response = await fetch(url, { headers: providerHeaders(), cache: "no-store", signal: AbortSignal.timeout(8_000) });
  } catch {
    throw new ExecutionError("provider_failure", "Jupiter order preparation could not be reached.", 502);
  }
  if (!response.ok) throw new ExecutionError("provider_failure", `Jupiter order preparation returned HTTP ${response.status}.`, 502);
  let body: unknown;
  try { body = await response.json(); } catch { throw new ExecutionError("provider_failure", "Jupiter returned malformed order data.", 502); }
  const parsed = takerOrderSchema.safeParse(body);
  if (!parsed.success) throw new ExecutionError("provider_failure", "Jupiter returned an incomplete executable order.", 502);
  const order = parsed.data;
  if (order.errorCode !== undefined && order.errorCode !== null || order.errorMessage) {
    const insufficient = order.errorCode === 1 || order.errorCode === "1";
    throw new ExecutionError(insufficient ? "insufficient_funds" : "provider_failure", insufficient ? "The wallet has insufficient funds for this order." : "Jupiter could not build the selected order.", insufficient ? 422 : 502);
  }
  if (!order.transaction) throw new ExecutionError("provider_failure", "Jupiter quoted the route but did not build a transaction.", 502);
  if (order.inputMint !== USDC_MINT || order.outputMint !== candidate.mint || order.inAmount !== inputAmount || order.taker !== wallet) {
    throw new ExecutionError("instrument_mismatch", "Jupiter returned an order that does not match the reviewed intent.", 502);
  }
  const expireAt = providerExpiry(order.expireAt);
  if (expireAt !== undefined && expireAt <= Date.now()) throw new ExecutionError("order_expired", "Jupiter returned an already-expired order.", 502);
  return { ...order, providerExpireAt: expireAt };
}

export async function executeJupiterOrder(input: { signedTransaction: string; requestId: string; lastValidBlockHeight?: string }): Promise<JupiterExecutionResult> {
  let response: Response;
  try {
    response = await fetch("https://api.jup.ag/swap/v2/execute", {
      method: "POST",
      headers: providerHeaders(true),
      body: JSON.stringify(input),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new ExecutionError("execution_uncertain", "Jupiter execution did not return a definite result. Reconcile this request before retrying.", 502);
  }
  let body: unknown;
  try { body = await response.json(); } catch { throw new ExecutionError("execution_uncertain", "Jupiter execution returned an unreadable result. Reconcile before retrying.", 502); }
  if (!response.ok) throw new ExecutionError("provider_failure", `Jupiter execution returned HTTP ${response.status}.`, 502);
  const parsed = executeResponseSchema.safeParse(body);
  if (!parsed.success) throw new ExecutionError("execution_uncertain", "Jupiter execution returned an incomplete result. Reconcile before retrying.", 502);
  return parsed.data;
}
