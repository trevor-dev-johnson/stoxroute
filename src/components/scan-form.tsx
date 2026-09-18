import type { FormEvent } from "react";

export const AMOUNT_PRESETS = ["100", "1000", "10000"] as const;

export function ScanForm({
  amount,
  loading,
  invalidMessage,
  onAmountChange,
  onPreset,
  onSubmit,
}: {
  amount: string;
  loading: boolean;
  invalidMessage: string | null;
  onAmountChange: (value: string) => void;
  onPreset: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="quote-form" onSubmit={onSubmit} noValidate>
      <div className="asset-line">
        <div><span className="asset-symbol">3 pairs</span><span>NVDA · TSLA · SPY</span></div>
        <span className="locked">Verified registry only</span>
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
            inputMode="decimal"
            aria-invalid={Boolean(invalidMessage)}
            aria-describedby={invalidMessage ? "amount-help amount-error" : "amount-help"}
          />
        </div>
        <button className="compare-button" type="submit" disabled={loading}>
          {loading ? "Scanning…" : "Scan opportunities"}<span aria-hidden>→</span>
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
