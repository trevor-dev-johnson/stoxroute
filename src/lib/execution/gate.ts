import { PublicKey } from "@solana/web3.js";
import { ExecutionError } from "@/lib/execution/errors";

export type ExecutionStatus = {
  enabled: boolean;
  configured: boolean;
  allowlistConfigured: boolean;
  testerRequired: boolean;
  reason: string;
};

function allowedWallets(): Set<string> {
  return new Set((process.env.EXECUTION_ALLOWED_WALLETS ?? "").split(",").map((wallet) => wallet.trim()).filter(Boolean));
}

export function validateWalletAddress(wallet: string): string {
  try { return new PublicKey(wallet).toBase58(); }
  catch { throw new ExecutionError("invalid_wallet", "The connected wallet address is invalid.", 400); }
}

export function getExecutionStatus(): ExecutionStatus {
  const enabled = process.env.EXECUTION_ENABLED === "true";
  const secretReady = (process.env.EXECUTION_INTENT_SECRET?.length ?? 0) >= 32;
  const apiReady = Boolean(process.env.JUPITER_API_KEY);
  const allowlistConfigured = allowedWallets().size > 0;
  return {
    enabled,
    configured: secretReady && apiReady,
    allowlistConfigured,
    testerRequired: !enabled,
    reason: !enabled
      ? "Execution is unavailable until an eligible independent tester is approved."
      : !secretReady || !apiReady
        ? "Execution is enabled but server credentials are incomplete."
        : "Execution is available only to an authorized tester wallet.",
  };
}

export function assertExecutionAuthorized(walletInput: string): { wallet: string; secret: string } {
  if (process.env.EXECUTION_ENABLED !== "true") {
    throw new ExecutionError("execution_disabled", "Execution is disabled on the server. Tester approval is required.", 403);
  }
  const wallet = validateWalletAddress(walletInput);
  const allowlist = allowedWallets();
  if (allowlist.size > 0 && !allowlist.has(wallet)) {
    throw new ExecutionError("wallet_not_allowed", "This wallet is not authorized for the supervised execution test.", 403);
  }
  const secret = process.env.EXECUTION_INTENT_SECRET;
  if (!secret || secret.length < 32 || !process.env.JUPITER_API_KEY) {
    throw new ExecutionError("execution_misconfigured", "Execution credentials are not configured on the server.", 503);
  }
  return { wallet, secret };
}

export function assertSameOrigin(request: Request): string {
  const requestOrigin = new URL(request.url).origin;
  const expected = process.env.APP_ORIGIN || requestOrigin;
  const origin = request.headers.get("origin");
  if (origin !== expected) {
    throw new ExecutionError("invalid_origin", "Execution requests must come from the configured application origin.", 403);
  }
  return expected;
}
