import { describe, expect, it } from "vitest";
import nacl from "tweetnacl";
import { Keypair } from "@solana/web3.js";
import { challengePayloadSchema, createChallenge, openEnvelope, orderIntentSchema, sealEnvelope, type OrderIntent } from "../src/lib/execution/envelope";
import { challengeMessage, verifyWalletProof } from "../src/lib/execution/wallet-proof";

const secret = "intent-secret-that-is-at-least-32-bytes";

describe("signed envelopes and wallet proof", () => {
  it("accepts the wallet that signed the exact challenge", () => {
    const keypair = Keypair.generate(); const wallet = keypair.publicKey.toBase58(); const now = 1_800_000_000_000;
    const challenge = createChallenge(wallet, "https://stoxroute.test", secret, now);
    const payload = openEnvelope(challenge.token, challengePayloadSchema, secret, now + 1);
    const signature = nacl.sign.detached(new TextEncoder().encode(challengeMessage(payload)), keypair.secretKey);
    expect(() => verifyWalletProof({ wallet, origin: payload.origin, challengeToken: challenge.token, signature: Buffer.from(signature).toString("base64"), secret, now: now + 1 })).not.toThrow();
  });

  it("rejects wallet changes", () => {
    const keypair = Keypair.generate(); const other = Keypair.generate().publicKey.toBase58(); const now = 1_800_000_000_000;
    const challenge = createChallenge(keypair.publicKey.toBase58(), "https://stoxroute.test", secret, now);
    const payload = openEnvelope(challenge.token, challengePayloadSchema, secret, now + 1);
    const signature = nacl.sign.detached(new TextEncoder().encode(challengeMessage(payload)), keypair.secretKey);
    expect(() => verifyWalletProof({ wallet: other, origin: payload.origin, challengeToken: challenge.token, signature: Buffer.from(signature).toString("base64"), secret, now: now + 1 })).toThrow(/does not match/i);
  });

  it("rejects tampering and expiration", () => {
    const now = 1_800_000_000_000; const challenge = createChallenge(Keypair.generate().publicKey.toBase58(), "https://stoxroute.test", secret, now);
    expect(() => openEnvelope(`${challenge.token.slice(0, -1)}x`, challengePayloadSchema, secret, now + 1)).toThrow(/altered|malformed/i);
    expect(() => openEnvelope(challenge.token, challengePayloadSchema, secret, now + 60_001)).toThrow(/expired/i);
  });

  it("binds every reviewed order field and rejects an altered intent", () => {
    const now = 1_800_000_000_000;
    const payload: OrderIntent = {
      version: 1, kind: "order_intent", wallet: Keypair.generate().publicKey.toBase58(), issuer: "Ondo", symbol: "NVDAon",
      inputMint: Keypair.generate().publicKey.toBase58(), outputMint: Keypair.generate().publicKey.toBase58(), inputAmount: "100000000",
      expectedExposure: "0.47", minimumExposure: "0.46", comparisonId: "123e4567-e89b-12d3-a456-426614174000",
      comparisonQuoteRequestId: "comparison-request", orderRequestId: "order-request", transactionMessageHash: "a".repeat(64),
      unsignedTransactionHash: "b".repeat(64), lastValidBlockHeight: "123", router: "jupiterz", issuedAt: now, expiresAt: now + 30_000,
    };
    const token = sealEnvelope(payload, secret);
    expect(openEnvelope(token, orderIntentSchema, secret, now + 1)).toMatchObject(payload);
    const [body, signature] = token.split(".");
    const changed = Buffer.from(JSON.stringify({ ...payload, inputAmount: "200000000" })).toString("base64url");
    expect(() => openEnvelope(`${changed}.${signature}`, orderIntentSchema, secret, now + 1)).toThrow(/altered/i);
    expect(body).not.toBe(changed);
  });
});
