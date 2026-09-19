import process from "node:process";

const BACKED_ASSETS_URL = "https://api.backed.fi/api/v2/public/assets";
const ONDO_ADDRESSES_URL = "https://docs.ondo.finance/addresses";
const ONDO_CSV_URL = "https://www.dropbox.com/scl/fi/qjfxyg748mx0dwi6up86d/EXTERNAL-Ondo-GM-Tokens-Ondo-GM-Tokens.csv?dl=1&rlkey=n3no1w78wrah3umsl0nr9s77i";
const JUPITER_ORDER_URL = "https://api.jup.ag/swap/v2/order";
const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const DEFAULT_TICKERS = ["AAPL", "MSFT", "META", "AMZN", "GOOGL", "QQQ", "COIN", "PLTR", "NFLX", "GLD"];
const INPUT_AMOUNT = "100000000";

function requestedTickers() {
  const argument = process.argv.find((value) => value.startsWith("--tickers="));
  return argument ? argument.slice("--tickers=".length).split(",").map((value) => value.trim().toUpperCase()).filter(Boolean) : DEFAULT_TICKERS;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(field); field = ""; }
    else if (character === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += character;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const [headers, ...values] = rows;
  return values.filter((value) => value.some(Boolean)).map((value) => Object.fromEntries(headers.map((header, index) => [header, value[index] ?? ""])));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.json();
}

async function loadOfficialRegistries() {
  const xStocks = [];
  for (let page = 0; ; page += 1) {
    const body = await fetchJson(`${BACKED_ASSETS_URL}?page=${page}`);
    if (!Array.isArray(body.nodes) || typeof body.page?.hasNextPage !== "boolean") throw new Error("xStocks registry pagination was malformed");
    xStocks.push(...body.nodes);
    if (!body.page.hasNextPage) break;
  }
  const ondoResponse = await fetch(ONDO_CSV_URL, { redirect: "follow", signal: AbortSignal.timeout(20_000) });
  if (!ondoResponse.ok) throw new Error(`Ondo registry returned HTTP ${ondoResponse.status}`);
  return { xStocks, ondo: parseCsv(await ondoResponse.text()) };
}

function exactOfficialOverlap(ticker, registries) {
  const xMatches = registries.xStocks.filter((asset) => asset.underlyingSymbol === ticker);
  if (xMatches.length !== 1) return { ticker, status: "excluded", reason: `Expected one xStocks entry; found ${xMatches.length}` };
  const xStock = xMatches[0];
  const xDeployment = xStock.deployments?.find((deployment) => deployment.network === "Solana");
  if (!xStock.underlyingIsin || !xDeployment?.address) return { ticker, status: "excluded", reason: "xStocks entry lacks an underlying ISIN or Solana mint" };
  const ondoMatches = registries.ondo.filter((asset) => asset.ISIN === xStock.underlyingIsin && asset["Solana Deployed Address"]);
  if (ondoMatches.length !== 1) {
    const tickerRows = registries.ondo.filter((asset) => asset["Stock Ticker"] === ticker);
    return {
      ticker,
      status: "excluded",
      reason: `Expected one Ondo row for xStocks underlying ISIN ${xStock.underlyingIsin}; found ${ondoMatches.length}`,
      tickerOnlyOndoIsins: tickerRows.map((row) => row.ISIN),
    };
  }
  const ondo = ondoMatches[0];
  if (ondo["Stock Ticker"] !== ticker) {
    return {
      ticker,
      status: "excluded",
      reason: `Underlying ISIN ${xStock.underlyingIsin} resolved to Ondo ticker ${ondo["Stock Ticker"]}, not ${ticker}`,
    };
  }
  return {
    ticker,
    status: "candidate",
    underlyingName: ondo["Stock Name"],
    underlyingIsin: xStock.underlyingIsin,
    instrumentType: ondo.Type?.toLowerCase() === "etf" ? "etf" : "stock",
    xStocks: { symbol: xStock.symbol, mint: xDeployment.address, officialTicker: xStock.underlyingSymbol },
    ondo: { symbol: ondo.Symbol, mint: ondo["Solana Deployed Address"], officialTicker: ondo["Stock Ticker"] },
  };
}

async function rpc(method, params) {
  const body = await fetchJson(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (body.error) throw new Error(`Solana RPC ${method} failed: ${body.error.message ?? "unknown error"}`);
  return body.result;
}

function exactlyOneExtension(info, extensionName) {
  const matches = (info.extensions ?? []).filter((extension) => extension.extension === extensionName);
  if (matches.length !== 1) throw new Error(`Expected exactly one ${extensionName} extension; found ${matches.length}`);
  return matches[0].state;
}

function validateMint(account, expected) {
  if (!account || account.owner !== TOKEN_2022_PROGRAM || account.data?.program !== "spl-token-2022") throw new Error(`${expected.symbol} is not an SPL Token-2022 mint`);
  const info = account.data?.parsed?.info;
  if (account.data?.parsed?.type !== "mint" || !info?.isInitialized) throw new Error(`${expected.symbol} is not initialized`);
  if (info.decimals !== expected.decimals) throw new Error(`${expected.symbol} decimals were ${info.decimals}, expected ${expected.decimals}`);
  if (!/^\d+$/.test(info.supply) || BigInt(info.supply) === 0n) throw new Error(`${expected.symbol} has no live supply`);
  const metadata = exactlyOneExtension(info, "tokenMetadata");
  if (metadata.mint !== expected.mint || metadata.symbol !== expected.symbol) throw new Error(`${expected.symbol} metadata does not match the official mint`);
  const scaled = exactlyOneExtension(info, "scaledUiAmountConfig");
  const pausable = (info.extensions ?? []).find((extension) => extension.extension === "pausableConfig");
  if (pausable?.state?.paused === true) throw new Error(`${expected.symbol} is paused`);
  return { decimals: info.decimals, supply: info.supply, multiplierConfig: scaled };
}

function activeMultiplier(config, chainTime) {
  const effective = Number(config.newMultiplierEffectiveTimestamp);
  const value = Number.isSafeInteger(effective) && chainTime >= effective ? config.newMultiplier : config.multiplier;
  if (value === undefined || value === null || !Number.isFinite(Number(value)) || Number(value) <= 0) throw new Error("Scaled UI multiplier was invalid");
  return String(value);
}

async function verifyOnchain(candidate) {
  const expected = [
    { ...candidate.xStocks, decimals: 8 },
    { ...candidate.ondo, decimals: 9 },
  ];
  const accounts = await rpc("getMultipleAccounts", [expected.map((asset) => asset.mint), { encoding: "jsonParsed", commitment: "confirmed" }]);
  if (!accounts?.context?.slot || accounts.value?.length !== 2) throw new Error("Solana RPC did not return a coherent mint pair");
  const chainTime = await rpc("getBlockTime", [accounts.context.slot]);
  if (!Number.isSafeInteger(chainTime) || Math.abs(Math.floor(Date.now() / 1000) - chainTime) > 120) throw new Error("Confirmed chain time was unavailable or stale");
  return {
    slot: accounts.context.slot,
    chainTime,
    mints: accounts.value.map((account, index) => {
      const state = validateMint(account, expected[index]);
      return { symbol: expected[index].symbol, mint: expected[index].mint, decimals: state.decimals, supply: state.supply, multiplier: activeMultiplier(state.multiplierConfig, chainTime), multiplierConfig: state.multiplierConfig };
    }),
  };
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function positiveQuote(asset, attempt = 0) {
  const url = new URL(JUPITER_ORDER_URL);
  url.searchParams.set("inputMint", USDC_MINT);
  url.searchParams.set("outputMint", asset.mint);
  url.searchParams.set("amount", INPUT_AMOUNT);
  const headers = { accept: "application/json" };
  if (process.env.JUPITER_API_KEY) headers["x-api-key"] = process.env.JUPITER_API_KEY;
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
  if (response.status === 429 && attempt === 0) { await delay(2_000); return positiveQuote(asset, 1); }
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 240).replace(/\s+/g, " ");
    throw new Error(`${asset.symbol} Jupiter quote returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }
  const quote = await response.json();
  if (quote.errorCode !== undefined && quote.errorCode !== null || quote.errorMessage) throw new Error(`${asset.symbol} Jupiter quote failed: ${quote.errorMessage ?? quote.errorCode}`);
  if (quote.inputMint !== USDC_MINT || quote.outputMint !== asset.mint || quote.inAmount !== INPUT_AMOUNT || !/^\d+$/.test(quote.outAmount ?? "") || BigInt(quote.outAmount) === 0n) {
    throw new Error(`${asset.symbol} Jupiter quote did not match the requested route`);
  }
  return { symbol: asset.symbol, mint: asset.mint, inAmount: quote.inAmount, outAmount: quote.outAmount, router: quote.router, requestId: quote.requestId };
}

async function verifyQuotes(candidate) {
  const quotes = [];
  for (const asset of [candidate.xStocks, candidate.ondo]) {
    await delay(1_100);
    quotes.push(await positiveQuote(asset));
  }
  return quotes;
}

async function main() {
  const generatedAt = new Date().toISOString();
  const tickers = requestedTickers();
  const registries = await loadOfficialRegistries();
  const matches = tickers.map((ticker) => exactOfficialOverlap(ticker, registries));
  const verified = [];
  const excluded = matches.filter((match) => match.status === "excluded");
  for (const candidate of matches.filter((match) => match.status === "candidate")) {
    try {
      const onchain = await verifyOnchain(candidate);
      const quotes = await verifyQuotes(candidate);
      verified.push({ ...candidate, status: "verified", onchain, quotes });
    } catch (error) {
      excluded.push({ ticker: candidate.ticker, status: "excluded", reason: error instanceof Error ? error.message : "Verification failed" });
    }
  }
  console.log(JSON.stringify({
    generatedAt,
    sources: { xStocks: BACKED_ASSETS_URL, ondoAddresses: ONDO_ADDRESSES_URL, ondoRegistry: ONDO_CSV_URL, solanaRpc: RPC_URL, jupiter: JUPITER_ORDER_URL },
    input: { mint: USDC_MINT, amountBaseUnits: INPUT_AMOUNT, amountUsdc: "100" },
    sourceCounts: { xStocks: registries.xStocks.length, ondo: registries.ondo.length },
    requestedTickers: tickers,
    verified,
    excluded,
  }, null, 2));
}

await main();
