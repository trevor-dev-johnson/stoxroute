import type { FormEvent } from "react";
import type { SupportedAsset } from "@/lib/stocks/registry";

export function ScanForm({
  amount,
  asset,
  loading,
  invalidMessage,
  onAmountChange,
  onAmountBlur,
  onSubmit,
}: {
  amount: string;
  asset: SupportedAsset | null;
  loading: boolean;
  invalidMessage: string | null;
  onAmountChange: (value: string) => void;
  onAmountBlur: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="quote-form" onSubmit={onSubmit} noValidate>
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
          {loading ? "Comparing…" : "Compare"}<span aria-hidden>→</span>
        </button>
      </div>
      <p className="amount-help" id="amount-help">Enter $1–$10,000 USDC</p>
      {invalidMessage && <p className="field-error" id="amount-error" role="alert">{invalidMessage}</p>}
    </form>
  );
}
