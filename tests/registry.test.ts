import { describe, expect, it } from "vitest";
import { SUPPORTED_ASSETS, validateAssetRegistry, type SupportedAsset } from "../src/lib/stocks/registry";

describe("supported asset registry", () => {
  it("contains verified, complete issuer pairs", () => {
    expect(() => validateAssetRegistry(SUPPORTED_ASSETS)).not.toThrow();
    expect(SUPPORTED_ASSETS.map((asset) => asset.ticker)).toEqual(["NVDA", "TSLA", "SPY"]);
    for (const asset of SUPPORTED_ASSETS) {
      expect(asset.candidates).toHaveLength(2);
      expect(new Set(asset.candidates.map((candidate) => candidate.issuer))).toEqual(new Set(["xStocks", "Ondo"]));
      expect(asset.candidates.every((candidate) => candidate.underlyingIsin === asset.underlyingIsin)).toBe(true);
    }
  });

  it("rejects duplicate tickers", () => {
    expect(() => validateAssetRegistry([SUPPORTED_ASSETS[0], SUPPORTED_ASSETS[0]])).toThrow(/Duplicate ticker/);
  });

  it("rejects duplicate issuers and mints", () => {
    const original = SUPPORTED_ASSETS[0];
    const duplicateIssuer = { ...original, candidates: [original.candidates[0], { ...original.candidates[1], issuer: "xStocks" }] } as SupportedAsset;
    expect(() => validateAssetRegistry([duplicateIssuer])).toThrow(/duplicate issuer/i);
    const duplicateMint = { ...original, candidates: [original.candidates[0], { ...original.candidates[1], mint: original.candidates[0].mint }] } as SupportedAsset;
    expect(() => validateAssetRegistry([duplicateMint])).toThrow(/Duplicate mint/);
  });

  it("rejects incomplete pairs", () => {
    const incomplete = { ...SUPPORTED_ASSETS[0], candidates: [SUPPORTED_ASSETS[0].candidates[0]] } as unknown as SupportedAsset;
    expect(() => validateAssetRegistry([incomplete])).toThrow(/exactly two/);
  });
});
