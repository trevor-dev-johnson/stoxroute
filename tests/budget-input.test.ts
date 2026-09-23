import { describe, expect, it } from "vitest";
import { parseBudgetInput } from "../src/lib/ui/budget-input";

describe("public budget input", () => {
  it("rejects scientific notation before a quote request can be built", () => {
    const parsed = parseBudgetInput("1e3");

    expect(parsed).toEqual({
      ok: false,
      message: "Enter a plain USDC amount with up to 6 decimals.",
    });
    expect("amount" in parsed).toBe(false);
  });
});
