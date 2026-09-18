import { z } from "zod";
import { HttpRequestError } from "@/lib/http/json";

export type ExecutionErrorCode =
  | "execution_disabled"
  | "execution_misconfigured"
  | "wallet_not_allowed"
  | "invalid_wallet"
  | "invalid_origin"
  | "invalid_request"
  | "wallet_proof_invalid"
  | "intent_invalid"
  | "intent_expired"
  | "wallet_changed"
  | "instrument_mismatch"
  | "order_expired"
  | "insufficient_funds"
  | "provider_failure"
  | "simulation_failure"
  | "transaction_invalid"
  | "execution_uncertain";

export class ExecutionError extends Error {
  constructor(
    public readonly code: ExecutionErrorCode,
    message: string,
    public readonly status = 400,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = "ExecutionError";
  }
}

export function executionErrorResponse(error: unknown): Response {
  if (error instanceof ExecutionError) {
    return Response.json(
      { error: error.code, message: error.message, detail: error.detail },
      { status: error.status, headers: { "cache-control": "no-store" } },
    );
  }
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return Response.json(
      { error: "invalid_request", message: "The execution request is malformed." },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }
  if (error instanceof HttpRequestError) {
    return Response.json(
      { error: "invalid_request", message: error.message },
      { status: error.status, headers: { "cache-control": "no-store" } },
    );
  }
  return Response.json(
    { error: "provider_failure", message: "Execution infrastructure is temporarily unavailable." },
    { status: 503, headers: { "cache-control": "no-store" } },
  );
}
