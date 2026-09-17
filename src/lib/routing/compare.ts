import Decimal from "decimal.js";

export type ComparisonLabel = "best_quoted_exposure" | "nearly_equal" | "equal";

export type RankedComparison = {
  winnerSymbol: string | null;
  label: ComparisonLabel;
  additionalExposure: string;
  advantageBps: string;
};

export function compareExposure(
  left: { symbol: string; exposure: string },
  right: { symbol: string; exposure: string },
  nearTieBps = new Decimal(1),
): RankedComparison {
  const a = new Decimal(left.exposure);
  const b = new Decimal(right.exposure);
  if (!a.gt(0) || !b.gt(0)) throw new Error("Comparable exposure must be positive");
  if (a.eq(b)) return { winnerSymbol: null, label: "equal", additionalExposure: "0", advantageBps: "0" };

  const higher = a.gt(b) ? { ...left, value: a } : { ...right, value: b };
  const lower = a.gt(b) ? b : a;
  const advantageBps = higher.value.div(lower).minus(1).mul(10_000);
  return {
    winnerSymbol: higher.symbol,
    label: advantageBps.lt(nearTieBps) ? "nearly_equal" : "best_quoted_exposure",
    additionalExposure: higher.value.minus(lower).toFixed(),
    advantageBps: advantageBps.toFixed(),
  };
}
