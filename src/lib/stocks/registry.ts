export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export type Issuer = "xStocks" | "Ondo";

export type StockCandidate = {
  readonly ticker: string;
  readonly underlyingName: string;
  readonly underlyingIsin: string;
  readonly issuer: Issuer;
  readonly symbol: string;
  readonly mint: string;
  readonly expectedDecimals: 8 | 9;
  readonly sourceUrl: string;
};

export type SupportedAsset = {
  readonly ticker: string;
  readonly underlyingName: string;
  readonly underlyingIsin: string;
  readonly instrumentType: "stock" | "etf";
  readonly candidates: readonly [StockCandidate, StockCandidate];
  readonly verifiedAt: string;
};

const BACKED_SOURCE = "https://api.backed.fi/api/v2/public/assets";
const ONDO_SOURCE = "https://docs.ondo.finance/addresses";

function pair(
  ticker: string,
  underlyingName: string,
  underlyingIsin: string,
  instrumentType: SupportedAsset["instrumentType"],
  xSymbol: string,
  xMint: string,
  ondoSymbol: string,
  ondoMint: string,
): SupportedAsset {
  return {
    ticker,
    underlyingName,
    underlyingIsin,
    instrumentType,
    verifiedAt: "2026-09-18",
    candidates: [
      { ticker, underlyingName, underlyingIsin, issuer: "xStocks", symbol: xSymbol, mint: xMint, expectedDecimals: 8, sourceUrl: BACKED_SOURCE },
      { ticker, underlyingName, underlyingIsin, issuer: "Ondo", symbol: ondoSymbol, mint: ondoMint, expectedDecimals: 9, sourceUrl: ONDO_SOURCE },
    ],
  };
}

export const SUPPORTED_ASSETS = [
  pair("NVDA", "NVIDIA", "US67066G1040", "stock", "NVDAx", "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh", "NVDAon", "gEGtLTPNQ7jcg25zTetkbmF7teoDLcrfTnQfmn2ondo"),
  pair("TSLA", "Tesla", "US88160R1014", "stock", "TSLAx", "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB", "TSLAon", "KeGv7bsfR4MheC1CkmnAVceoApjrkvBhHYjWb67ondo"),
  pair("SPY", "SPDR S&P 500 ETF", "US78462F1030", "etf", "SPYx", "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W", "SPYon", "k18WJUULWheRkSpSquYGdNNmtuE2Vbw1hpuUi92ondo"),
] as const satisfies readonly SupportedAsset[];

export type SupportedTicker = (typeof SUPPORTED_ASSETS)[number]["ticker"];
export const SUPPORTED_TICKERS = SUPPORTED_ASSETS.map((asset) => asset.ticker) as [SupportedTicker, ...SupportedTicker[]];

export function validateAssetRegistry(registry: readonly SupportedAsset[]): void {
  if (registry.length === 0) throw new Error("Asset registry cannot be empty");
  const tickers = new Set<string>();
  const symbols = new Set<string>();
  const mints = new Set<string>();

  for (const asset of registry) {
    if (!asset.ticker || !asset.underlyingName || !asset.underlyingIsin || asset.candidates.length !== 2) {
      throw new Error("Every supported asset requires complete metadata and exactly two candidates");
    }
    if (tickers.has(asset.ticker)) throw new Error(`Duplicate ticker: ${asset.ticker}`);
    tickers.add(asset.ticker);
    const issuers = new Set<Issuer>();
    for (const candidate of asset.candidates) {
      if (candidate.ticker !== asset.ticker || candidate.underlyingIsin !== asset.underlyingIsin) {
        throw new Error(`${asset.ticker} candidate metadata does not match its asset`);
      }
      if (issuers.has(candidate.issuer)) throw new Error(`${asset.ticker} has a duplicate issuer`);
      if (symbols.has(candidate.symbol)) throw new Error(`Duplicate symbol: ${candidate.symbol}`);
      if (mints.has(candidate.mint)) throw new Error(`Duplicate mint: ${candidate.mint}`);
      issuers.add(candidate.issuer);
      symbols.add(candidate.symbol);
      mints.add(candidate.mint);
    }
  }
}

validateAssetRegistry(SUPPORTED_ASSETS);

export const NVIDIA_CANDIDATES = SUPPORTED_ASSETS[0].candidates;

export function assetForTicker(ticker: string): SupportedAsset | undefined {
  return SUPPORTED_ASSETS.find((asset) => asset.ticker === ticker);
}

export function candidateForMint(mint: string): StockCandidate | undefined {
  return SUPPORTED_ASSETS.flatMap((asset) => asset.candidates).find((candidate) => candidate.mint === mint);
}
