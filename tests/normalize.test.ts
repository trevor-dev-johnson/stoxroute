import { describe, expect, it } from "vitest";
import { normalizeOutput, resolveActiveMultiplier, usdcToBaseUnits } from "../src/lib/routing/normalize";
import { compareExposure } from "../src/lib/routing/compare";

describe("USDC conversion", () => {
  it.each([["100", "100000000"], ["1000", "1000000000"], ["10000", "10000000000"], ["1.000001", "1000001"]])("converts %s exactly", (input, expected) => expect(usdcToBaseUnits(input)).toBe(expected));
  it.each(["0", "-1", "1e3", "1.0000001", "10000.01", "abc"])("rejects %s", (input) => expect(() => usdcToBaseUnits(input)).toThrow());
});

describe("multiplier timing", () => {
  const config = { multiplier: "1.01", newMultiplier: "1.02", newMultiplierEffectiveTimestamp: 100 };
  it("uses current before transition", () => expect(resolveActiveMultiplier(config, 99)).toBe("1.01"));
  it("switches exactly at transition", () => expect(resolveActiveMultiplier(config, 100)).toBe("1.02"));
  it("uses new value after transition", () => expect(resolveActiveMultiplier(config, 101)).toBe("1.02"));
  it("rejects a nonpositive value", () => expect(() => resolveActiveMultiplier({ ...config, multiplier: "0" }, 99)).toThrow());
});

describe("historical NVIDIA fixture", () => {
  it("reproduces precise exposure and ranks Ondo", () => {
    const x = normalizeOutput("4686198502", 8, "1.001701196801074");
    const ondo = normalizeOutput("46887391600", 9, "1.0017152487959897");
    expect(x).toBe("46.94170647900800170791148"); expect(ondo).toBe("46.96781514198899757346652");
    expect(compareExposure({ symbol: "NVDAx", exposure: x }, { symbol: "NVDAon", exposure: ondo }).winnerSymbol).toBe("NVDAon");
  });
  it("normalizes before ranking in a synthetic decimal-mismatch case", () => {
    const eightDecimals = normalizeOutput("990000000", 8, "1"); const nineDecimals = normalizeOutput("1000000000", 9, "1");
    expect(BigInt("1000000000") > BigInt("990000000")).toBe(true);
    expect(compareExposure({ symbol: "eight", exposure: eightDecimals }, { symbol: "nine", exposure: nineDecimals }).winnerSymbol).toBe("eight");
  });
  it("does not let display rounding change a near-tie ranking", () => {
    const result = compareExposure({ symbol: "a", exposure: "1.00004" }, { symbol: "b", exposure: "1" });
    expect(result.winnerSymbol).toBe("a"); expect(result.label).toBe("nearly_equal");
  });
});

describe("additional registry asset normalization", () => {
  it("normalizes TSLA across 8- and 9-decimal mints", () => {
    expect(normalizeOutput("250000000", 8, "1")).toBe("2.5");
    expect(normalizeOutput("2500000000", 9, "1")).toBe("2.5");
  });

  it("applies the SPY scaled multipliers after decimal conversion", () => {
    expect(normalizeOutput("100000000", 8, "1.005714560286254")).toBe("1.005714560286254");
    expect(normalizeOutput("1000000000", 9, "1.0094730727840426")).toBe("1.0094730727840426");
  });
});
