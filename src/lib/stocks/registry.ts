export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export type StockCandidate = {
  readonly ticker: "NVDA";
  readonly underlyingName: string;
  readonly isin: string;
  readonly issuer: "xStocks" | "Ondo";
  readonly symbol: "NVDAx" | "NVDAon";
  readonly mint: string;
  readonly expectedDecimals: 8 | 9;
  readonly sourceUrl: string;
};

export const NVIDIA_CANDIDATES = [
  {
    ticker: "NVDA",
    underlyingName: "NVIDIA",
    isin: "US67066G1040",
    issuer: "xStocks",
    symbol: "NVDAx",
    mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
    expectedDecimals: 8,
    sourceUrl: "https://api.backed.fi/api/v2/public/assets",
  },
  {
    ticker: "NVDA",
    underlyingName: "NVIDIA",
    isin: "US67066G1040",
    issuer: "Ondo",
    symbol: "NVDAon",
    mint: "gEGtLTPNQ7jcg25zTetkbmF7teoDLcrfTnQfmn2ondo",
    expectedDecimals: 9,
    sourceUrl: "https://docs.ondo.finance/addresses",
  },
] as const satisfies readonly StockCandidate[];

export function candidateForMint(mint: string): StockCandidate | undefined {
  return NVIDIA_CANDIDATES.find((candidate) => candidate.mint === mint);
}
