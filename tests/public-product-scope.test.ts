import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");

describe("public product scope", () => {
  it("keeps wallet and execution infrastructure out of the public comparison page", () => {
    expect(pageSource).not.toMatch(/WalletControl|ExecutionPanel|Connect wallet|Tester required|Execution unavailable|Supervised execution/i);
    expect(pageSource).toContain("View route details");
    expect(pageSource).toContain("Trading execution is not currently available.");
  });
});
