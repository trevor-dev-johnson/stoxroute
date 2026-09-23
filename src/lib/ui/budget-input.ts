import Decimal from "decimal.js";

const USDC_INPUT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;

export type ParsedBudgetInput =
  | { ok: true; amount: string }
  | { ok: false; message: string };

export function canonicalBudgetInput(value: string): string {
  return value.replace(/,/g, "").trim();
}

export function formattedBudgetInput(value: string): string {
  const canonical = canonicalBudgetInput(value);
  if (!canonical || !/^(?:0|[1-9]\d*)(?:\.\d{0,6})?$/.test(canonical)) return value;
  const [whole, fraction] = canonical.split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${fraction !== undefined ? `.${fraction}` : ""}`;
}

export function parseBudgetInput(value: string): ParsedBudgetInput {
  const canonical = canonicalBudgetInput(value);
  if (!USDC_INPUT_PATTERN.test(canonical)) {
    return { ok: false, message: "Enter a plain USDC amount with up to 6 decimals." };
  }
  try {
    const amount = new Decimal(canonical);
    if (amount.lt(1) || amount.gt(10_000)) {
      return { ok: false, message: "Amount must be between $1 and $10,000 USDC." };
    }
  } catch {
    return { ok: false, message: "Enter a valid USDC amount." };
  }
  return { ok: true, amount: canonical };
}
