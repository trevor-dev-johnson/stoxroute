import { describe, expect, it } from "vitest";
import { Connection, Keypair, PublicKey, SystemProgram, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { NVIDIA_CANDIDATES, USDC_MINT } from "../src/lib/stocks/registry";
import { inspectTransaction, simulatePreparedTransaction, validateSignedTransaction } from "../src/lib/execution/transaction";

function transactionFor(wallet = Keypair.generate(), outputMint = NVIDIA_CANDIDATES[0].mint) {
  const instruction = new TransactionInstruction({
    programId: SystemProgram.programId,
    keys: [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: new PublicKey(USDC_MINT), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(outputMint), isSigner: false, isWritable: false },
    ],
    data: Buffer.from([1]),
  });
  const message = new TransactionMessage({ payerKey: wallet.publicKey, recentBlockhash: Keypair.generate().publicKey.toBase58(), instructions: [instruction] }).compileToV0Message();
  return { wallet, transaction: new VersionedTransaction(message) };
}

describe("transaction validation", () => {
  it("requires the reviewed wallet and both reviewed mints", async () => {
    const { wallet, transaction } = transactionFor();
    const base64 = Buffer.from(transaction.serialize()).toString("base64");
    const inspected = await inspectTransaction(base64, { wallet: wallet.publicKey.toBase58(), inputMint: USDC_MINT, outputMint: NVIDIA_CANDIDATES[0].mint });
    expect(inspected.walletSignerIndex).toBe(0); expect(inspected.instructionCount).toBe(1);
    await expect(inspectTransaction(base64, { wallet: wallet.publicKey.toBase58(), inputMint: USDC_MINT, outputMint: NVIDIA_CANDIDATES[1].mint })).rejects.toMatchObject({ code: "instrument_mismatch" });
  });

  it("rejects wallet changes and altered message bytes after signing", async () => {
    const first = transactionFor();
    const inspected = await inspectTransaction(Buffer.from(first.transaction.serialize()).toString("base64"), { wallet: first.wallet.publicKey.toBase58(), inputMint: USDC_MINT, outputMint: NVIDIA_CANDIDATES[0].mint });
    first.transaction.sign([first.wallet]);
    const signed = Buffer.from(first.transaction.serialize()).toString("base64");
    await expect(validateSignedTransaction(signed, { wallet: Keypair.generate().publicKey.toBase58(), messageHash: inspected.messageHash })).rejects.toMatchObject({ code: "wallet_changed" });
    await expect(validateSignedTransaction(signed, { wallet: first.wallet.publicKey.toBase58(), messageHash: "0".repeat(64) })).rejects.toMatchObject({ code: "intent_invalid" });
    await expect(validateSignedTransaction(signed, { wallet: first.wallet.publicKey.toBase58(), messageHash: inspected.messageHash })).resolves.toMatchObject({
      signedTransactionHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      signature: expect.any(String),
    });
  });

  it("surfaces simulation failures", async () => {
    const { transaction } = transactionFor();
    const connection = { simulateTransaction: async () => ({ value: { err: { InstructionError: [0, "Custom"] }, logs: [], unitsConsumed: 10 } }) } as unknown as Connection;
    await expect(simulatePreparedTransaction(transaction, connection)).rejects.toMatchObject({ code: "simulation_failure" });
  });
});
