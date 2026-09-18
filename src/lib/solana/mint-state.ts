import { z } from "zod";
import { SUPPORTED_ASSETS, TOKEN_2022_PROGRAM, type StockCandidate, type SupportedAsset } from "@/lib/stocks/registry";
import { resolveActiveMultiplier, type ScaledUiConfig } from "@/lib/routing/normalize";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

const extensionSchema = z.object({
  extension: z.string(),
  state: z.record(z.string(), z.unknown()),
});

const accountSchema = z.object({
  owner: z.string(),
  data: z.object({
    program: z.string(),
    parsed: z.object({
      type: z.literal("mint"),
      info: z.object({
        decimals: z.number().int(),
        supply: z.string().regex(/^\d+$/),
        isInitialized: z.literal(true),
        extensions: z.array(extensionSchema),
      }),
    }),
  }),
});

const accountsResponseSchema = z.object({
  result: z.object({
    context: z.object({ slot: z.number().int().positive() }),
    value: z.array(accountSchema.nullable()),
  }),
});

const blockTimeResponseSchema = z.object({ result: z.number().int().positive().nullable() });

export type MintNormalizationState = {
  mint: string;
  decimals: number;
  supply: string;
  multiplier: string;
  multiplierConfig: ScaledUiConfig;
  slot: number;
  chainTime: number;
  fetchedAt: string;
  cacheStatus: "live" | "cached";
};

const MAX_CHAIN_LAG_SECONDS = 120;
const MAX_CHAIN_FUTURE_SECONDS = 60;

export function assertPlausibleChainTime(chainTime: number, wallTime = Math.floor(Date.now() / 1_000)): void {
  if (!Number.isSafeInteger(chainTime) || chainTime <= 0) throw new Error("Confirmed chain time is unavailable");
  const delta = wallTime - chainTime;
  if (delta > MAX_CHAIN_LAG_SECONDS || delta < -MAX_CHAIN_FUTURE_SECONDS) {
    throw new Error("Confirmed chain time is stale or implausible");
  }
}

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Solana RPC returned HTTP ${response.status}`);
  const body: unknown = await response.json();
  if (typeof body === "object" && body !== null && "error" in body) throw new Error("Solana RPC returned an error");
  return body;
}

function extensionState(extensions: z.infer<typeof extensionSchema>[], name: string): Record<string, unknown> {
  const matches = extensions.filter((extension) => extension.extension === name);
  if (matches.length !== 1) throw new Error(`Mint must contain exactly one ${name} extension`);
  return matches[0].state;
}

function parseCandidate(
  candidate: StockCandidate,
  account: z.infer<typeof accountSchema>,
  slot: number,
  chainTime: number,
  fetchedAt: string,
): MintNormalizationState {
  if (account.owner !== TOKEN_2022_PROGRAM || account.data.program !== "spl-token-2022") {
    throw new Error(`${candidate.symbol} has an unexpected token program`);
  }
  const info = account.data.parsed.info;
  if (info.decimals !== candidate.expectedDecimals) throw new Error(`${candidate.symbol} decimals do not match the registry`);

  const scaled = extensionState(info.extensions, "scaledUiAmountConfig");
  const config: ScaledUiConfig = z.object({
    multiplier: z.union([z.string(), z.number()]).transform(String),
    newMultiplier: z.union([z.string(), z.number()]).transform(String),
    newMultiplierEffectiveTimestamp: z.number().int().nonnegative(),
  }).parse(scaled);

  const metadata = extensionState(info.extensions, "tokenMetadata");
  if (metadata.mint !== candidate.mint || metadata.symbol !== candidate.symbol) {
    throw new Error(`${candidate.symbol} metadata does not match the supported instrument`);
  }
  const pausable = info.extensions.find((extension) => extension.extension === "pausableConfig");
  if (pausable?.state.paused === true) throw new Error(`${candidate.symbol} is paused`);

  return {
    mint: candidate.mint,
    decimals: info.decimals,
    supply: info.supply,
    multiplier: resolveActiveMultiplier(config, chainTime),
    multiplierConfig: config,
    slot,
    chainTime,
    fetchedAt,
    cacheStatus: "live",
  };
}

const cache = new Map<string, { expiresAt: number; transitionAt: number; value: MintNormalizationState[] }>();

export async function loadAssetMintStates(asset: SupportedAsset, force = false): Promise<MintNormalizationState[]> {
  const now = Date.now();
  const cached = cache.get(asset.ticker);
  if (!force && cached && now < cached.expiresAt && now / 1000 < cached.transitionAt) {
    return cached.value.map((state) => ({ ...state, cacheStatus: "cached" }));
  }

  const accountsRaw = await rpc("getMultipleAccounts", [
    asset.candidates.map((candidate) => candidate.mint),
    { encoding: "jsonParsed", commitment: "confirmed" },
  ]);
  const accounts = accountsResponseSchema.parse(accountsRaw).result;
  if (accounts.value.length !== asset.candidates.length || accounts.value.some((account) => account === null)) {
    throw new Error("One or more supported mint accounts are unavailable");
  }
  const blockTimeRaw = await rpc("getBlockTime", [accounts.context.slot]);
  const chainTime = blockTimeResponseSchema.parse(blockTimeRaw).result;
  if (chainTime === null) throw new Error("Confirmed chain time is unavailable");
  assertPlausibleChainTime(chainTime, Math.floor(now / 1_000));
  const fetchedAt = new Date().toISOString();
  const value = asset.candidates.map((candidate, index) =>
    parseCandidate(candidate, accounts.value[index]!, accounts.context.slot, chainTime, fetchedAt),
  );
  const futureTransitions = value
    .map((state) => state.multiplierConfig.newMultiplierEffectiveTimestamp)
    .filter((timestamp) => timestamp > chainTime);
  const transitionAt = futureTransitions.length ? Math.min(...futureTransitions) : Number.POSITIVE_INFINITY;
  cache.set(asset.ticker, { value, expiresAt: now + 60_000, transitionAt });
  return value;
}

export async function loadNvidiaMintStates(force = false): Promise<MintNormalizationState[]> {
  return loadAssetMintStates(SUPPORTED_ASSETS[0], force);
}

export function clearMintStateCacheForTests(): void {
  cache.clear();
}
