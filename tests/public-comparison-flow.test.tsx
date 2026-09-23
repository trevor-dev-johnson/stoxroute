import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SupportedMarkets } from "../src/app/page";
import { POST as retiredBulkPost } from "../src/app/api/opportunities/route";
import { SUPPORTED_ASSETS } from "../src/lib/stocks/registry";

afterEach(() => vi.unstubAllGlobals());

describe("single-asset public comparison flow", () => {
  it("renders the verified registry without requesting live quotes", () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);

    const markup = renderToStaticMarkup(<SupportedMarkets />);

    for (const asset of SUPPORTED_ASSETS) {
      expect(markup).toContain(asset.ticker);
      expect(markup).toContain(asset.underlyingName.replace("&", "&amp;"));
      expect(markup).toContain(asset.instrumentType === "etf" ? "ETF" : "Stock");
    }
    expect(markup).toContain("xStocks · Ondo");
    expect(markup).toContain("Verified");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("retires the bulk endpoint without calling a provider", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);

    const response = await retiredBulkPost();

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      error: "endpoint_retired",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
