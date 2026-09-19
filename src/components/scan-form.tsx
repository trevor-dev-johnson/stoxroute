import type { FormEvent } from "react";
import type { SupportedAsset } from "@/lib/stocks/registry";

export const AMOUNT_PRESETS = ["100", "1000", "10000"] as const;

export function ScanForm({
  amount,
  asset,
  loading,
  invalidMessage,
  onAmountChange,
  onPreset,
  onAmountBlur,
  onSubmit,
}: {
  amount: string;
  asset: SupportedAsset | null;
  loading: boolean;
  invalidMessage: string | null;
  onAmountChange: (value: string) => void;
  onPreset: (value: string) => void;
  onAmountBlur: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="quote-form" onSubmit={onSubmit} noValidate>
      <div className="asset-line">
        <div><span className="asset-symbol">{asset?.ticker ?? "Select"}</span><span>{asset ? `${asset.underlyingName} · ${asset.candidates.map((candidate) => candidate.issuer).join(" + ")}` : "Choose a verified market above"}</span></div>
        <span className="locked">{asset ? `${asset.instrumentType === "etf" ? "ETF" : "Stock"} · live pair supported` : "No route selected"}</span>
      </div>
      <label htmlFor="amount">USDC budget</label>
      <div className="amount-row">
        <div className="amount-field">
          <span>$</span>
          <input
            id="amount"
            name="amount"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            onBlur={onAmountBlur}
            inputMode="decimal"
            aria-invalid={Boolean(invalidMessage)}
            aria-describedby={invalidMessage ? "amount-help amount-error" : "amount-help"}
          />
        </div>
        <button className="compare-button" type="submit" disabled={loading || !asset}>
          {loading ? "Comparing…" : "Compare routes"}<span aria-hidden>→</span>
        </button>
      </div>
      <div className="preset-row" id="amount-help">
        <span>Presets</span>
        {AMOUNT_PRESETS.map((preset) => (
          <button
            type="button"
            key={preset}
            className={amount === preset ? "active" : ""}
            aria-pressed={amount === preset}
            onClick={() => onPreset(preset)}
          >
            ${Number(preset).toLocaleString("en-US")}
          </button>
        ))}
        <span className="range">Range $1–$10,000</span>
      </div>
      {invalidMessage && <p className="field-error" id="amount-error" role="alert">{invalidMessage}</p>}
    </form>
  );
}
