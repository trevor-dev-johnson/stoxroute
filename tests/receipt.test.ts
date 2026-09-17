import { describe, expect, it } from "vitest";
import { Connection } from "@solana/web3.js";
import { loadConfirmedReceipt } from "../src/lib/execution/receipt";
import { NVIDIA_CANDIDATES, USDC_MINT } from "../src/lib/stocks/registry";

describe("confirmed receipt accounting", () => {
  it("uses actual confirmed wallet token-balance deltas", async () => {
    const wallet = "wallet";
    const connection = { getTransaction: async () => ({ slot: 42, meta: { err: null,
      preTokenBalances: [{ owner: wallet, mint: USDC_MINT, uiTokenAmount: { amount: "1000000000" } }, { owner: wallet, mint: NVIDIA_CANDIDATES[0].mint, uiTokenAmount: { amount: "10" } }],
      postTokenBalances: [{ owner: wallet, mint: USDC_MINT, uiTokenAmount: { amount: "899000000" } }, { owner: wallet, mint: NVIDIA_CANDIDATES[0].mint, uiTokenAmount: { amount: "47000010" } }],
    } }) } as unknown as Connection;
    const receipt = await loadConfirmedReceipt({ signature: "signature", wallet, inputMint: USDC_MINT, outputMint: NVIDIA_CANDIDATES[0].mint }, connection);
    expect(receipt).toMatchObject({ status: "confirmed", actualInputDebit: "101000000", actualOutputCredit: "47000000", slot: "42" });
  });

  it("does not present a missing transaction as confirmed", async () => {
    const connection = { getTransaction: async () => null } as unknown as Connection;
    await expect(loadConfirmedReceipt({ signature: "signature", wallet: "wallet", inputMint: USDC_MINT, outputMint: NVIDIA_CANDIDATES[0].mint }, connection)).resolves.toMatchObject({ status: "confirming" });
  });
});
