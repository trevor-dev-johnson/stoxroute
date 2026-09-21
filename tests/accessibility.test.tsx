import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ScanForm } from "../src/components/scan-form";
import { SUPPORTED_ASSETS } from "../src/lib/stocks/registry";

describe("scan amount accessibility", () => {
  it("links the compact budget field to its helper and validation message", () => {
    const markup = renderToStaticMarkup(<ScanForm amount="1000" asset={SUPPORTED_ASSETS[0]} loading={false} invalidMessage="Amount is invalid" onAmountChange={() => undefined} onAmountBlur={() => undefined} onSubmit={() => undefined} />);
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('aria-describedby="amount-help amount-error"');
    expect(markup).toContain('id="amount-help"');
    expect(markup).toContain('id="amount-error"');
    expect(markup).toContain('>Compare<');
  });
});
