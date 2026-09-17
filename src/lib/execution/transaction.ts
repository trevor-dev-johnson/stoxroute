import { createHash } from "node:crypto";
import bs58 from "bs58";
import nacl from "tweetnacl";
import {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import { ExecutionError } from "@/lib/execution/errors";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
const MAX_TRANSACTION_BYTES = 1_500;

export type TransactionInspection = {
  transaction: VersionedTransaction;
  messageHash: string;
  transactionHash: string;
  walletSignerIndex: number;
  signerCount: number;
  instructionCount: number;
  accountCount: number;
  programIds: string[];
};

function hash(bytes: Uint8Array): string { return createHash("sha256").update(bytes).digest("hex"); }

function decodeTransaction(transactionBase64: string): { bytes: Buffer; transaction: VersionedTransaction } {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(transactionBase64) || transactionBase64.length > 2_500) {
    throw new ExecutionError("transaction_invalid", "Jupiter returned an invalid transaction encoding.", 502);
  }
  const bytes = Buffer.from(transactionBase64, "base64");
  if (bytes.length === 0 || bytes.length > MAX_TRANSACTION_BYTES) {
    throw new ExecutionError("transaction_invalid", "Jupiter returned a transaction with an invalid size.", 502);
  }
  try { return { bytes, transaction: VersionedTransaction.deserialize(bytes) }; }
  catch { throw new ExecutionError("transaction_invalid", "Jupiter returned a transaction that could not be decoded.", 502); }
}

async function lookupTables(connection: Connection, transaction: VersionedTransaction): Promise<AddressLookupTableAccount[]> {
  const message = transaction.message;
  if (!("addressTableLookups" in message) || message.addressTableLookups.length === 0) return [];
  const tables = await Promise.all(message.addressTableLookups.map(async (lookup) => {
    const result = await connection.getAddressLookupTable(lookup.accountKey, { commitment: "confirmed" });
    if (!result.value) throw new ExecutionError("transaction_invalid", "A transaction address lookup table is unavailable.", 502);
    return result.value;
  }));
  return tables;
}

function allAccountKeys(transaction: VersionedTransaction, tables: AddressLookupTableAccount[]): PublicKey[] {
  const message = transaction.message;
  const keys = message.version === "legacy"
    ? message.getAccountKeys()
    : message.getAccountKeys({ addressLookupTableAccounts: tables });
  const result: PublicKey[] = [];
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys.get(index);
    if (!key) throw new ExecutionError("transaction_invalid", "The transaction contains an unresolved account index.", 502);
    result.push(key);
  }
  return result;
}

function signerKeys(transaction: VersionedTransaction): PublicKey[] {
  const message = transaction.message;
  return message.staticAccountKeys.slice(0, message.header.numRequiredSignatures);
}

export async function inspectTransaction(
  transactionBase64: string,
  expected: { wallet: string; inputMint: string; outputMint: string },
  connection = new Connection(RPC_URL, "confirmed"),
): Promise<TransactionInspection> {
  const { bytes, transaction } = decodeTransaction(transactionBase64);
  const tables = await lookupTables(connection, transaction);
  const accounts = allAccountKeys(transaction, tables);
  const signers = signerKeys(transaction);
  const walletKey = new PublicKey(expected.wallet);
  const walletSignerIndex = signers.findIndex((key) => key.equals(walletKey));
  if (walletSignerIndex < 0) throw new ExecutionError("transaction_invalid", "The connected wallet is not a required signer for this order.", 502);
  if (!accounts.some((key) => key.equals(new PublicKey(expected.inputMint))) || !accounts.some((key) => key.equals(new PublicKey(expected.outputMint)))) {
    throw new ExecutionError("instrument_mismatch", "The transaction accounts do not contain the reviewed input and output mints.", 502);
  }
  if (transaction.signatures.length !== signers.length) throw new ExecutionError("transaction_invalid", "The transaction signature layout is invalid.", 502);
  if (transaction.signatures[walletSignerIndex].some((byte) => byte !== 0)) {
    throw new ExecutionError("transaction_invalid", "The wallet signature slot was unexpectedly pre-signed.", 502);
  }
  const instructions = transaction.message.compiledInstructions;
  if (instructions.length === 0) throw new ExecutionError("transaction_invalid", "The transaction contains no instructions.", 502);
  const programIds = instructions.map((instruction) => {
    const key = accounts[instruction.programIdIndex];
    if (!key) throw new ExecutionError("transaction_invalid", "The transaction references an invalid program index.", 502);
    return key.toBase58();
  });
  const messageBytes = transaction.message.serialize();
  return {
    transaction,
    messageHash: hash(messageBytes),
    transactionHash: hash(bytes),
    walletSignerIndex,
    signerCount: signers.length,
    instructionCount: instructions.length,
    accountCount: accounts.length,
    programIds: [...new Set(programIds)],
  };
}

export async function validateSignedTransaction(
  signedTransactionBase64: string,
  expected: { wallet: string; messageHash: string },
): Promise<{ transaction: VersionedTransaction; signedTransactionHash: string; signature: string }> {
  const { bytes, transaction } = decodeTransaction(signedTransactionBase64);
  const messageBytes = transaction.message.serialize();
  if (hash(messageBytes) !== expected.messageHash) throw new ExecutionError("intent_invalid", "The signed transaction message differs from the reviewed order.", 401);
  const signers = signerKeys(transaction);
  const walletKey = new PublicKey(expected.wallet);
  const walletSignerIndex = signers.findIndex((key) => key.equals(walletKey));
  if (walletSignerIndex < 0) throw new ExecutionError("wallet_changed", "The signing wallet does not match the reviewed wallet.", 409);
  const signature = transaction.signatures[walletSignerIndex];
  if (!signature || !nacl.sign.detached.verify(messageBytes, signature, walletKey.toBytes())) {
    throw new ExecutionError("transaction_invalid", "The reviewed wallet signature is missing or invalid.", 401);
  }
  return { transaction, signedTransactionHash: hash(bytes), signature: bs58.encode(signature) };
}

export async function assertOrderNotExpired(lastValidBlockHeight: string | undefined, connection = new Connection(RPC_URL, "confirmed")): Promise<void> {
  if (!lastValidBlockHeight) return;
  const current = await connection.getBlockHeight("confirmed");
  if (BigInt(current) > BigInt(lastValidBlockHeight)) throw new ExecutionError("order_expired", "The Jupiter order block height has expired.", 410);
}

export async function simulatePreparedTransaction(transaction: VersionedTransaction, connection = new Connection(RPC_URL, "confirmed")) {
  try {
    const result = await connection.simulateTransaction(transaction, { sigVerify: false, replaceRecentBlockhash: false, commitment: "processed" });
    if (result.value.err) {
      throw new ExecutionError("simulation_failure", "The prepared transaction did not simulate successfully.", 422, JSON.stringify(result.value.err));
    }
    return { ok: true as const, unitsConsumed: result.value.unitsConsumed ?? null, logsAvailable: Boolean(result.value.logs?.length) };
  } catch (error) {
    if (error instanceof ExecutionError) throw error;
    throw new ExecutionError("simulation_failure", "Transaction simulation was unavailable.", 502);
  }
}
