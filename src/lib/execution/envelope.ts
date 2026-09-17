import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { ExecutionError } from "@/lib/execution/errors";

const basePayload = z.object({ version: z.literal(1), issuedAt: z.number().int().positive(), expiresAt: z.number().int().positive() });
export const challengePayloadSchema = basePayload.extend({ kind: z.literal("wallet_challenge"), wallet: z.string(), origin: z.string().url(), nonce: z.string().min(32) });
export const orderIntentSchema = basePayload.extend({
  kind: z.literal("order_intent"), wallet: z.string(), issuer: z.enum(["xStocks", "Ondo"]), symbol: z.enum(["NVDAx", "NVDAon"]),
  inputMint: z.string(), outputMint: z.string(), inputAmount: z.string().regex(/^\d+$/), expectedExposure: z.string(), minimumExposure: z.string().optional(),
  comparisonId: z.string().uuid(), comparisonQuoteRequestId: z.string().min(1), orderRequestId: z.string().min(1),
  transactionMessageHash: z.string().regex(/^[a-f0-9]{64}$/), unsignedTransactionHash: z.string().regex(/^[a-f0-9]{64}$/),
  lastValidBlockHeight: z.string().regex(/^\d+$/).optional(), providerExpireAt: z.number().int().positive().optional(), router: z.string().min(1),
});
export const receiptPayloadSchema = basePayload.extend({
  kind: z.literal("receipt"), wallet: z.string(), signature: z.string().min(32), inputMint: z.string(), outputMint: z.string(),
  inputAmount: z.string().regex(/^\d+$/), orderRequestId: z.string().min(1),
});
export type ChallengePayload = z.infer<typeof challengePayloadSchema>;
export type OrderIntent = z.infer<typeof orderIntentSchema>;
export type ReceiptPayload = z.infer<typeof receiptPayloadSchema>;

function mac(payloadPart: string, secret: string): Buffer { return createHmac("sha256", secret).update(payloadPart).digest(); }

export function sealEnvelope(payload: ChallengePayload | OrderIntent | ReceiptPayload, secret: string): string {
  const payloadPart = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadPart}.${mac(payloadPart, secret).toString("base64url")}`;
}

export function openEnvelope<T>(token: string, schema: z.ZodType<T>, secret: string, now = Date.now()): T {
  const parts = token.split(".");
  if (parts.length !== 2) throw new ExecutionError("intent_invalid", "The signed execution envelope is malformed.", 401);
  const expected = mac(parts[0], secret);
  let supplied: Buffer;
  try { supplied = Buffer.from(parts[1], "base64url"); } catch { throw new ExecutionError("intent_invalid", "The signed execution envelope is malformed.", 401); }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new ExecutionError("intent_invalid", "The signed execution envelope was altered.", 401);
  let decoded: unknown;
  try { decoded = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")); } catch { throw new ExecutionError("intent_invalid", "The signed execution envelope is malformed.", 401); }
  const parsed = schema.safeParse(decoded);
  if (!parsed.success) throw new ExecutionError("intent_invalid", "The signed execution envelope is invalid.", 401);
  if ((parsed.data as { expiresAt: number }).expiresAt <= now) throw new ExecutionError("intent_expired", "The execution request expired. Prepare a fresh order.", 410);
  return parsed.data;
}

export function createChallenge(wallet: string, origin: string, secret: string, now = Date.now()) {
  const payload: ChallengePayload = { version: 1, kind: "wallet_challenge", wallet, origin, nonce: randomBytes(24).toString("hex"), issuedAt: now, expiresAt: now + 60_000 };
  const message = ["StoxRoute execution authorization", `Origin: ${origin}`, `Wallet: ${wallet}`, `Nonce: ${payload.nonce}`, `Expires: ${payload.expiresAt}`].join("\n");
  return { token: sealEnvelope(payload, secret), message, expiresAt: payload.expiresAt };
}
