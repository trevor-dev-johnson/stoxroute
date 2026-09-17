import Decimal from "decimal.js";

Decimal.set({ precision: 50, rounding: Decimal.ROUND_HALF_UP });

const USDC_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;

export type ScaledUiConfig = {
  multiplier: string;
  newMultiplier: string;
  newMultiplierEffectiveTimestamp: number;
};

function positiveDecimal(value: string, field: string): Decimal {
  let decimal: Decimal;
  try {
    decimal = new Decimal(value);
  } catch {
    throw new Error(`${field} is malformed`);
  }
  if (!decimal.isFinite() || !decimal.gt(0)) {
    throw new Error(`${field} must be positive`);
  }
  return decimal;
}

export function usdcToBaseUnits(input: string): string {
  if (!USDC_PATTERN.test(input)) throw new Error("Enter a plain USDC amount with up to 6 decimals");
  const amount = new Decimal(input);
  if (amount.lt(1) || amount.gt(10_000)) throw new Error("Amount must be between 1 and 10,000 USDC");
  return amount.mul(1_000_000).toFixed(0);
}

export function resolveActiveMultiplier(config: ScaledUiConfig, chainTimeSeconds: number): string {
  if (!Number.isSafeInteger(chainTimeSeconds) || chainTimeSeconds <= 0) throw new Error("Chain time is unavailable");
  if (!Number.isSafeInteger(config.newMultiplierEffectiveTimestamp) || config.newMultiplierEffectiveTimestamp < 0) {
    throw new Error("Multiplier transition timestamp is invalid");
  }
  const current = positiveDecimal(config.multiplier, "Current multiplier");
  const next = positiveDecimal(config.newMultiplier, "Scheduled multiplier");
  return chainTimeSeconds >= config.newMultiplierEffectiveTimestamp ? next.toString() : current.toString();
}

export function normalizeOutput(rawBaseUnits: string, decimals: number, multiplier: string): string {
  if (!/^\d+$/.test(rawBaseUnits) || BigInt(rawBaseUnits) <= BigInt(0)) throw new Error("Output amount is invalid");
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) throw new Error("Mint decimals are invalid");
  const activeMultiplier = positiveDecimal(multiplier, "Active multiplier");
  return new Decimal(rawBaseUnits).div(new Decimal(10).pow(decimals)).mul(activeMultiplier).toFixed();
}

export function usdcPerShareEquivalent(usdc: string, exposure: string): string {
  return positiveDecimal(usdc, "USDC amount").div(positiveDecimal(exposure, "Exposure")).toFixed();
}
