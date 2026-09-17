import { describe, expect, it, vi } from "vitest";
import { classifyExecutionFailure } from "../src/lib/execution/client-state";
import { clearExecutionCacheForTests, runExecutionOnce } from "../src/lib/execution/idempotency";

describe("execution recovery states", () => {
  it("classifies rejected signatures and boundary failures", () => {
    expect(classifyExecutionFailure(new Error("User rejected the request"))).toBe("rejected_signature");
    expect(classifyExecutionFailure({ code: "wallet_changed" })).toBe("wrong_wallet");
    expect(classifyExecutionFailure({ code: "order_expired" })).toBe("expired_order");
    expect(classifyExecutionFailure({ code: "insufficient_funds" })).toBe("insufficient_funds");
    expect(classifyExecutionFailure({ code: "simulation_failure" })).toBe("simulation_failure");
    expect(classifyExecutionFailure({ code: "provider_failure" })).toBe("provider_failure");
  });

  it("deduplicates submission attempts in-process without creating a new order", async () => {
    clearExecutionCacheForTests(); const operation = vi.fn(async () => ({ signature: "sig" }));
    const [first, duplicate] = await Promise.all([runExecutionOnce("same-signed-order", operation), runExecutionOnce("same-signed-order", operation)]);
    expect(first).toEqual(duplicate); expect(operation).toHaveBeenCalledTimes(1);
  });
});
