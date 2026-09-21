import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");

describe("public product scope", () => {
  it("keeps wallet and execution infrastructure out of the public comparison page", () => {
    expect(pageSource).not.toMatch(/WalletControl|ExecutionPanel|Connect wallet|Tester required|Execution unavailable|Supervised execution/i);
    expect(pageSource).toContain("Find the better tokenized-stock route.");
    expect(pageSource).toContain("Search NVIDIA, Apple, Tesla, ETF…");
    expect(pageSource).toContain("View details");
    expect(pageSource).not.toMatch(/Featured markets|refresh required|Stale comparison|displayExpiresAt/i);
    expect(pageSource).toContain("PUBLIC_QUOTE_WARNING_MS = 120_000");
    expect(pageSource).toContain("may no longer reflect current routing");
    expect(pageSource).toContain("Trading execution is not currently available.");
  });
});
