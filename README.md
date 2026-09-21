# StoxRoute

**Choose the asset. Compare every verified route.**

**Live demo:** [stoxroute.vercel.app](https://stoxroute.vercel.app)

StoxRoute lets a user choose from nine verified stocks and ETFs and compare two issuer routes for one exact USDC input. It normalizes every output with current Token-2022 Scaled UI state and explains the exposure and quote-implied value difference. A bounded multi-asset scanner remains available as a secondary view.

![StoxRoute desktop answer-first comparison](docs/screenshots/stoxroute-desktop.png)

## The problem

Tokenized representations of the same stock or ETF can use different decimals, multipliers, issuers, fees, and liquidity. A larger raw token count does not necessarily represent more underlying exposure, and matching underlying ISINs do not make instruments legally identical or interchangeable.

## The solution

StoxRoute searches only its verified registry, gives the selected issuer pair one equal USDC budget, reads the pair from coherent Solana state, and fetches both routes together. The answer leads with the better quoted issuer, contextual exposure difference, percentage advantage, quote-implied value difference, and age. Simplified route cards follow, with full normalization evidence available on demand. The optional Opportunity Board repeats the same contract across the bounded registry and ranks only complete pairs.

The bounded production registry contains:

- NVIDIA: NVDAx versus NVDAon
- Tesla: TSLAx versus TSLAon
- SPDR S&P 500 ETF: SPYx versus SPYon
- Apple: AAPLx versus AAPLon
- Microsoft: MSFTx versus MSFTon
- Meta Platforms: METAx versus METAon
- Amazon: AMZNx versus AMZNon
- Alphabet Class A: GOOGLx versus GOOGLon
- Invesco QQQ: QQQx versus QQQon

Exact issuer sources and live-mint verification are in [docs/ASSET-REGISTRY.md](docs/ASSET-REGISTRY.md).

## Verified functionality

- Live walletless comparison and scanning of nine issuer pairs for `$1`–`$10,000` USDC.
- Streaming progress while assets are processed sequentially; the two routes within each pair are fetched together.
- One bounded whole-pair retry after Jupiter `429`; no unbounded polling or fixture fallback.
- Exact decimal conversion and BigInt-safe base-unit handling.
- Current Token-2022 Scaled UI multiplier resolution from a coherent confirmed pair read.
- Validation of token program, mint metadata, decimals, paused state, multiplier transitions, chain time, quote direction, amounts, and router response.
- Honest complete-pair ranking by basis points or quote-implied dollar difference. Partial results never become winners.
- Existing per-asset `/api/quotes` support for every registry ticker.
- Wallet Standard discovery through Solana Wallet Adapter, including Phantom when installed.
- Server-disabled execution infrastructure with wallet proof, optional allowlist, fresh taker order, signed intent binding, decoded transaction validation, simulation, and confirmed-chain receipt accounting.
- A repeatable official-source verifier that joins on underlying ISIN, validates coherent mint state, and requires two positive live quotes before registry inclusion.
- 59 domain, registry, public-scope, asset-search, scanner, accessibility, HTTP-boundary, and execution-boundary tests.

No live transaction has been prepared, signed, submitted, or confirmed during the scanner work. Execution remains disabled pending separate semantic validation and independently eligible tester verification.

## Product walkthrough

1. Open the app without connecting a wallet.
2. Search by ticker/company name or choose a curated featured market.
3. Enter one exact USDC budget, then select **Compare**.
4. Read the answer-first winner, exposure difference, percentage advantage, and quote-implied value before the two simplified route cards. Expand **View details** for the ISIN, mint, full-precision output, multiplier, cache status, fees, and quote time.
5. Optionally select **Scan all 9 supported markets** to open the bounded secondary scanner. Complete pairs rank first; partial and unavailable rows remain visible but unranked.
6. Select a board row to bring that market back into the primary comparison workspace.

Each result has a 30-second reading window. Run a fresh scan before relying on an expired result.

## Architecture

| Layer | Responsibility |
|---|---|
| Validated registry | Explicit issuer-sourced pairs; duplicate ticker/issuer/symbol/mint and incomplete-pair checks |
| Next.js App Router | Responsive scanner, NDJSON progress endpoint, per-asset quote API, server-only provider boundary |
| Solana JSON-RPC | Coherent pair mint state, confirmed chain time, simulation, and confirmed transaction metadata |
| Jupiter Swap V2 | Walletless comparison orders plus the separately gated taker-specific path |
| `decimal.js` + BigInt | Precise normalization, ranking, and integer base-unit handling |
| Wallet Adapter | Wallet Standard discovery and browser-side signing only |
| HMAC envelopes | Short-lived execution binding; inactive while the execution gate is off |

```text
token units = output base units / 10^mint decimals
normalized underlying exposure = token units × active onchain multiplier
relative advantage (bps) = (higher exposure / lower exposure − 1) × 10,000
quote-implied dollar advantage = additional exposure × winning quote's USDC per normalized unit
```

Historical evidence under `docs/evidence/` and `research/` is never used as a runtime fallback.

## Provider and freshness behavior

- Scan size is fixed to the production registry; callers cannot inject arbitrary mints or URLs.
- Assets are scanned one at a time to control shared provider traffic. The two issuer routes for one asset run concurrently.
- Any `429` causes one bounded backoff (maximum two seconds) and refresh of the whole pair. A second throttle remains an unavailable result.
- One asset can fail without cancelling the rest of the scan.
- Quote responses more than two seconds apart are not compared.
- Confirmed chain time more than 120 seconds behind or 60 seconds ahead of wall time is rejected.
- Mint state may cache for at most 60 seconds and never across a scheduled multiplier transition. Results explicitly say `live` or `cached`; quotes are always current provider requests.
- Results expire after 30 seconds in the UI.

## Safety model

- `EXECUTION_ENABLED=false` blocks preparation server-side even if the UI is bypassed.
- Execution mutations require the configured origin and a signed wallet challenge; configured wallet allowlists are enforced on the server.
- Order preparation refreshes normalization state and checks the exact input mint, output mint, amount, taker, issuer, and symbol.
- The decoded transaction must contain the reviewed wallet signer and mints and pass simulation.
- The application never requests or handles seed phrases or private keys.
- JSON APIs enforce media type and actual streamed-body size. Production responses set CSP, anti-framing, MIME-sniffing, referrer, permissions, opener, and HSTS headers.
- The public scan and per-asset endpoints have a process-local burst limit. Provider and platform controls remain authoritative across serverless instances.

These controls are not legal or eligibility approval. Tokenized assets can have issuer, liquidity, transfer, eligibility, and jurisdiction restrictions. Displayed dollar differences are quote-implied estimates, not realized savings.

## Local setup

Node.js 24.x and npm 11.x were used for the verified build.

```powershell
git clone https://github.com/trevor-dev-johnson/stoxroute.git
Set-Location stoxroute
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. Scan and per-asset comparison modes require no wallet.

## Environment variables

| Variable | Scope | Purpose |
|---|---|---|
| `SOLANA_RPC_URL` | Server | Confirmed mint reads, simulation, and receipts |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Public client | Wallet Adapter connection endpoint |
| `NEXT_PUBLIC_APP_URL` | Public build | Canonical metadata/social-sharing origin |
| `APP_ORIGIN` | Server | Exact allowed origin for execution mutations |
| `JUPITER_API_KEY` | Server | Recommended for shared quote reliability; required for managed execution |
| `EXECUTION_ENABLED` | Server | Exact `true` enables the separate supervised execution boundary |
| `EXECUTION_ALLOWED_WALLETS` | Server | Comma-separated approved tester wallets |
| `EXECUTION_INTENT_SECRET` | Server | Random HMAC secret of at least 32 characters |

Never expose the Jupiter key or intent secret in a `NEXT_PUBLIC_` variable. Keep `EXECUTION_ENABLED=false` for this scanner release.

## Verification

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

The production dependency audit currently reports 12 moderate transitive advisories in the Solana wallet/web3 tree and no high or critical advisory. There is no compatible automatic fix in the current direct dependency range.

## Demo guidance

Choose a market, run a `$1,000` comparison, and explain the answer-first winner, exposure difference, percentage advantage, and quote-implied difference. Then optionally scan all supported markets and point out incremental progress and any honest partial result. Say explicitly that the values are estimates and trading execution is not currently available. See [docs/SUBMISSION.md](docs/SUBMISSION.md).

![StoxRoute mobile answer-first comparison](docs/screenshots/stoxroute-mobile.png)

## Limitations

- The scanner is intentionally limited to nine verified pairs; it is not a general token-discovery engine.
- Quote ranking does not assess issuer quality, legal equivalence, availability to a particular person, or final execution cost.
- Public RPC and Jupiter rate limits can temporarily produce partial or unavailable rows.
- Process-local request throttling is not distributed rate limiting.
- No eligible tester transaction or confirmed receipt has been live-verified.

## Roadmap

1. Configure dedicated Solana RPC and Jupiter credentials for shared-demo reliability.
2. Separately close semantic transaction-flow validation before considering execution.
3. Complete an independently eligible, smallest-meaningful-amount supervised verification only with explicit authorization.
4. Rerun `node scripts/verify-asset-registry.mjs` before any registry addition; never promote a ticker-only match or a one-sided quote.

## Sources and credits

Solana supplies the chain and Token-2022 infrastructure; Jupiter supplies routing; xStocks/Backed and Ondo supply the compared instruments and issuer data. Core dependencies include Next.js, React, Solana Web3.js, Solana Wallet Adapter, Decimal.js, Zod, TweetNaCl, and Vitest. See `package.json` and `package-lock.json` for exact versions.
