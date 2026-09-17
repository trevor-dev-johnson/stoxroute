import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWalletlessQuote } from "../src/lib/providers/jupiter";
import { NVIDIA_CANDIDATES, USDC_MINT } from "../src/lib/stocks/registry";

const candidate = NVIDIA_CANDIDATES[0];
const validQuote = {
  inAmount: "100000000",
  outAmount: "47000000",
  otherAmountThreshold: "46000000",
  swapMode: "ExactIn",
  inputMint: USDC_MINT,
  outputMint: candidate.mint,
  router: "metis",
  requestId: "quote-request-1",
  feeBps: 10,
};

afterEach(() => vi.unstubAllGlobals());

describe("Jupiter quote boundary", () => {
  it("accepts a matching positive ExactIn quote", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(validQuote), { status: 200 })));
    const result = await fetchWalletlessQuote(candidate, "100000000");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rawOutAmount).toBe("47000000");
  });

  it("keeps HTTP 429 distinct from no-route", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("limited", { status: 429, headers: { "retry-after": "1" } })));
    const result = await fetchWalletlessQuote(candidate, "100000000");
    expect(result).toMatchObject({ ok: false, code: "rate_limited", retryAfterMs: 1000 });
  });

  it("detects a zero-valued provider error code", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...validQuote, errorCode: 0 }), { status: 200 })));
    const result = await fetchWalletlessQuote(candidate, "100000000");
    expect(result).toMatchObject({ ok: false, code: "provider_error" });
  });

  it("rejects a mismatched output mint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...validQuote, outputMint: "wrong" }), { status: 200 })));
    const result = await fetchWalletlessQuote(candidate, "100000000");
    expect(result).toMatchObject({ ok: false, code: "malformed_response" });
  });

  it("rejects malformed JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not-json", { status: 200 })));
    const result = await fetchWalletlessQuote(candidate, "100000000");
    expect(result).toMatchObject({ ok: false, code: "malformed_response" });
  });
});
