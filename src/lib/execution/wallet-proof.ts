import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import { challengePayloadSchema, openEnvelope } from "@/lib/execution/envelope";
import { ExecutionError } from "@/lib/execution/errors";

export function challengeMessage(payload: { origin: string; wallet: string; nonce: string; expiresAt: number }): string {
  return ["StoxRoute execution authorization", `Origin: ${payload.origin}`, `Wallet: ${payload.wallet}`, `Nonce: ${payload.nonce}`, `Expires: ${payload.expiresAt}`].join("\n");
}

export function verifyWalletProof(input: { wallet: string; origin: string; challengeToken: string; signature: string; secret: string; now?: number }): void {
  const challenge = openEnvelope(input.challengeToken, challengePayloadSchema, input.secret, input.now);
  if (challenge.wallet !== input.wallet || challenge.origin !== input.origin) throw new ExecutionError("wallet_proof_invalid", "Wallet authorization does not match this request.", 401);
  let signature: Buffer;
  try { signature = Buffer.from(input.signature, "base64"); } catch { throw new ExecutionError("wallet_proof_invalid", "Wallet authorization signature is malformed.", 401); }
  if (signature.length !== nacl.sign.signatureLength) throw new ExecutionError("wallet_proof_invalid", "Wallet authorization signature is malformed.", 401);
  const valid = nacl.sign.detached.verify(new TextEncoder().encode(challengeMessage(challenge)), signature, new PublicKey(input.wallet).toBytes());
  if (!valid) throw new ExecutionError("wallet_proof_invalid", "Wallet authorization signature is invalid.", 401);
}
