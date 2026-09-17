export type ExecutionFlowState =
  | "disconnected" | "connecting" | "unavailable" | "ready" | "authorizing" | "preparing" | "review"
  | "signing" | "rejected_signature" | "wrong_wallet" | "expired_order" | "insufficient_funds"
  | "provider_failure" | "simulation_failure" | "submitted" | "confirming" | "failed" | "confirmed";

export function classifyExecutionFailure(error: unknown): ExecutionFlowState {
  const candidate = error as { code?: string; message?: string };
  const message = candidate?.message ?? (error instanceof Error ? error.message : "");
  if (/reject|declin|cancel/i.test(message)) return "rejected_signature";
  if (candidate?.code === "wallet_changed") return "wrong_wallet";
  if (candidate?.code === "intent_expired" || candidate?.code === "order_expired") return "expired_order";
  if (candidate?.code === "insufficient_funds") return "insufficient_funds";
  if (candidate?.code === "simulation_failure") return "simulation_failure";
  return "provider_failure";
}
