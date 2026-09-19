import { describe, expect, it } from "vitest";
import { SUPPORTED_ASSETS, validateAssetRegistry, type SupportedAsset } from "../src/lib/stocks/registry";

describe("supported asset registry", () => {
  it("contains verified, complete issuer pairs", () => {
    expect(() => validateAssetRegistry(SUPPORTED_ASSETS)).not.toThrow();
    expect(SUPPORTED_ASSETS.map((asset) => asset.ticker)).toEqual(["NVDA", "TSLA", "SPY", "AAPL", "MSFT", "META", "AMZN", "GOOGL", "QQQ"]);
    for (const asset of SUPPORTED_ASSETS) {
      expect(asset.candidates).toHaveLength(2);
      expect(new Set(asset.candidates.map((candidate) => candidate.issuer))).toEqual(new Set(["xStocks", "Ondo"]));
      expect(asset.candidates.every((candidate) => candidate.underlyingIsin === asset.underlyingIsin)).toBe(true);
    }
  });

  it("preserves the independently verified expanded issuer mappings", () => {
    expect(SUPPORTED_ASSETS.slice(3).map((asset) => ({
      ticker: asset.ticker,
      isin: asset.underlyingIsin,
      mints: asset.candidates.map((candidate) => candidate.mint),
    }))).toEqual([
      { ticker: "AAPL", isin: "US0378331005", mints: ["XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", "123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo"] },
      { ticker: "MSFT", isin: "US5949181045", mints: ["XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX", "FRmH6iRkMr33DLG6zVLR7EM4LojBFAuq6NtFzG6ondo"] },
      { ticker: "META", isin: "US30303M1027", mints: ["Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu", "fDxs5y12E7x7jBwCKBXGqt71uJmCWsAQ3Srkte6ondo"] },
      { ticker: "AMZN", isin: "US0231351067", mints: ["Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg", "14Tqdo8V1FhzKsE3W2pFsZCzYPQxxupXRcqw9jv6ondo"] },
      { ticker: "GOOGL", isin: "US02079K3059", mints: ["XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN", "bbahNA5vT9WJeYft8tALrH1LXWffjwqVoUbqYa1ondo"] },
      { ticker: "QQQ", isin: "US46090E1038", mints: ["Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ", "HrYNm6jTQ71LoFphjVKBTdAE4uja7WsmLG8VxB8ondo"] },
    ]);
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
