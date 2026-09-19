import { describe, expect, it } from "vitest";
import { matchingSupportedAssets } from "../src/lib/ui/asset-search";

describe("supported asset search", () => {
  it("matches registry assets by ticker and company name", () => {
    expect(matchingSupportedAssets("NVDA").map((asset) => asset.ticker)).toEqual(["NVDA"]);
    expect(matchingSupportedAssets("tesla").map((asset) => asset.ticker)).toEqual(["TSLA"]);
    expect(matchingSupportedAssets("s&p").map((asset) => asset.ticker)).toEqual(["SPY"]);
    expect(matchingSupportedAssets("Apple").map((asset) => asset.ticker)).toEqual(["AAPL"]);
  });

  it("never suggests an asset outside the verified registry", () => {
    expect(matchingSupportedAssets("Adobe")).toEqual([]);
  });
});
