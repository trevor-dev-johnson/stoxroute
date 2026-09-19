import { SUPPORTED_ASSETS, type SupportedAsset } from "@/lib/stocks/registry";

export function assetSearchLabel(asset: SupportedAsset) {
  return `${asset.ticker} — ${asset.underlyingName}`;
}

export function matchingSupportedAssets(query: string, selected: SupportedAsset | null = null) {
  const needle = query.trim().toLowerCase();
  if (!needle || selected && query === assetSearchLabel(selected)) return [...SUPPORTED_ASSETS];

  return SUPPORTED_ASSETS.filter((asset) =>
    asset.ticker.toLowerCase().includes(needle)
    || asset.underlyingName.toLowerCase().includes(needle),
  );
}
