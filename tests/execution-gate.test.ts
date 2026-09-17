import { afterEach, describe, expect, it } from "vitest";
import { Keypair } from "@solana/web3.js";
import { assertExecutionAuthorized, assertSameOrigin, getExecutionStatus } from "../src/lib/execution/gate";
import { ExecutionError } from "../src/lib/execution/errors";
import { POST as challengePost } from "../src/app/api/execution/challenge/route";

const original = { ...process.env };
afterEach(() => { process.env = { ...original }; });

function configured(wallet: string) {
  process.env.EXECUTION_ENABLED = "true";
  process.env.EXECUTION_ALLOWED_WALLETS = wallet;
  process.env.EXECUTION_INTENT_SECRET = "s".repeat(32);
  process.env.JUPITER_API_KEY = "test-key";
}

describe("server execution gate", () => {
  it("blocks a direct endpoint bypass while disabled", async () => {
    const wallet = Keypair.generate().publicKey.toBase58();
    configured(wallet); process.env.EXECUTION_ENABLED = "false";
    const response = await challengePost(new Request("http://localhost:3000/api/execution/challenge", {
      method: "POST", headers: { "content-type": "application/json", origin: "http://localhost:3000" }, body: JSON.stringify({ wallet }),
    }));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: "execution_disabled" });
  });

  it("enforces a configured allowlist", () => {
    const allowed = Keypair.generate().publicKey.toBase58();
    const other = Keypair.generate().publicKey.toBase58();
    configured(allowed);
    expect(() => assertExecutionAuthorized(other)).toThrowError(expect.objectContaining<Partial<ExecutionError>>({ code: "wallet_not_allowed" }));
  });

  it("fails closed when secrets are missing", () => {
    const wallet = Keypair.generate().publicKey.toBase58();
    configured(wallet); delete process.env.EXECUTION_INTENT_SECRET;
    expect(() => assertExecutionAuthorized(wallet)).toThrowError(expect.objectContaining<Partial<ExecutionError>>({ code: "execution_misconfigured" }));
    expect(getExecutionStatus().configured).toBe(false);
  });

  it("rejects missing and cross-origin mutation requests", () => {
    process.env.APP_ORIGIN = "https://stoxroute.example";
    expect(() => assertSameOrigin(new Request("https://stoxroute.example/api/order"))).toThrowError(expect.objectContaining<Partial<ExecutionError>>({ code: "invalid_origin" }));
    expect(() => assertSameOrigin(new Request("https://stoxroute.example/api/order", { headers: { origin: "https://attacker.example" } }))).toThrowError(expect.objectContaining<Partial<ExecutionError>>({ code: "invalid_origin" }));
    expect(assertSameOrigin(new Request("https://stoxroute.example/api/order", { headers: { origin: "https://stoxroute.example" } }))).toBe("https://stoxroute.example");
  });
});
