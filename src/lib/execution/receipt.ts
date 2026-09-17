import { Connection } from "@solana/web3.js";
import { ExecutionError } from "@/lib/execution/errors";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

type TokenBalance = { mint: string; owner?: string; uiTokenAmount: { amount: string } };

function totalFor(balances: readonly TokenBalance[] | null | undefined, wallet: string, mint: string): bigint {
  return (balances ?? [])
    .filter((balance) => balance.owner === wallet && balance.mint === mint)
    .reduce((sum, balance) => sum + BigInt(balance.uiTokenAmount.amount), BigInt(0));
}

export async function loadConfirmedReceipt(
  input: { signature: string; wallet: string; inputMint: string; outputMint: string },
  connection = new Connection(RPC_URL, "confirmed"),
) {
  const transaction = await connection.getTransaction(input.signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
  if (!transaction) return { status: "confirming" as const, signature: input.signature };
  if (transaction.meta?.err) return { status: "failed" as const, signature: input.signature, slot: String(transaction.slot), error: JSON.stringify(transaction.meta.err) };
  const preInput = totalFor(transaction.meta?.preTokenBalances, input.wallet, input.inputMint);
  const postInput = totalFor(transaction.meta?.postTokenBalances, input.wallet, input.inputMint);
  const preOutput = totalFor(transaction.meta?.preTokenBalances, input.wallet, input.outputMint);
  const postOutput = totalFor(transaction.meta?.postTokenBalances, input.wallet, input.outputMint);
  const debit = preInput - postInput;
  const credit = postOutput - preOutput;
  if (debit <= BigInt(0) || credit <= BigInt(0)) {
    throw new ExecutionError("execution_uncertain", "The confirmed transaction does not yet expose the expected wallet token deltas.", 409);
  }
  return {
    status: "confirmed" as const,
    signature: input.signature,
    slot: String(transaction.slot),
    actualInputDebit: debit.toString(),
    actualOutputCredit: credit.toString(),
    explorerUrl: `https://solscan.io/tx/${input.signature}`,
  };
}
