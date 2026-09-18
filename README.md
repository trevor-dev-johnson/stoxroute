# StoxRoute

**One budget. Every verified pair.**

**Live demo:** [stoxroute.vercel.app](https://stoxroute.vercel.app)

StoxRoute scans live Jupiter routes for verified NVIDIA, Tesla, and SPY issuer pairs using the same exact USDC input. It normalizes every output with current Token-2022 Scaled UI state, ranks complete pairs by relative exposure advantage, and keeps partial failures visible. The scanner works without a wallet.

![StoxRoute desktop scanner](docs/screenshots/stoxroute-desktop.png)

## The problem

Tokenized representations of the same stock or ETF can use different decimals, multipliers, issuers, fees, and liquidity. A larger raw token count does not necessarily represent more underlying exposure, and matching underlying ISINs do not make instruments legally identical or interchangeable.

## The solution

StoxRoute gives every supported issuer pair one equal USDC budget, reads each pair from coherent Solana state, and fetches both routes together. The Opportunity Board ranks only complete, fresh comparisons and shows the leading issuer, both normalized exposures, absolute difference, relative basis-point difference, quote-implied dollar difference, routers, availability, and age.

The bounded production registry contains:

- NVIDIA: NVDAx versus NVDAon
- Tesla: TSLAx versus TSLAon
- SPDR S&P 500 ETF: SPYx versus SPYon

Exact issuer sources and live-mint verification are in [docs/ASSET-REGISTRY.md](docs/ASSET-REGISTRY.md).

## Verified functionality

- Live walletless scanning of three issuer pairs for `$1`–`$10,000` USDC.
- Streaming progress while assets are processed sequentially; the two routes within each pair are fetched together.
- One bounded whole-pair retry after Jupiter `429`; no unbounded polling or fixture fallback.
- Exact decimal conversion and BigInt-safe base-unit handling.
- Current Token-2022 Scaled UI multiplier resolution from a coherent confirmed pair read.
- Validation of token program, mint metadata, decimals, paused state, multiplier transitions, chain time, quote direction, amounts, and router response.
- Honest complete-pair ranking by basis points or quote-implied dollar difference. Partial results never become winners.
- Existing per-asset `/api/quotes` support for every registry ticker.
- Wallet Standard discovery through Solana Wallet Adapter, including Phantom when installed.
- Server-disabled execution infrastructure with wallet proof, optional allowlist, fresh taker order, signed intent binding, decoded transaction validation, simulation, and confirmed-chain receipt accounting.
- 55 domain, registry, scanner, accessibility, HTTP-boundary, and execution-boundary tests.

No live transaction has been prepared, signed, submitted, or confirmed during the scanner work. Execution remains disabled pending separate semantic validation and independently eligible tester verification.

## Product walkthrough

1. Open the app without connecting a wallet.
2. Choose a preset or enter one exact USDC budget.
3. Select **Scan opportunities**. Progress updates as the bounded three-asset registry is scanned.
4. Sort the Opportunity Board by basis-point or quote-implied dollar advantage. Complete pairs rank first; partial and unavailable rows remain visible but unranked.
5. Select an asset row to open its detailed side-by-side issuer comparison.
6. Expand **Instrument details** to inspect the ISIN, mint, raw output, multiplier, cache status, router, fees, and quote time.

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

Run a `$1,000` scan, point out incremental progress and any honest partial result, sort the board, select a complete row, and explain the detailed normalized comparison. Say explicitly that the values are estimates, the dollar difference is quote-implied, and purchasing remains unavailable. See [docs/SUBMISSION.md](docs/SUBMISSION.md).

![StoxRoute mobile scanner](docs/screenshots/stoxroute-mobile.png)

## Limitations

- The scanner is intentionally limited to three verified pairs; it is not a general token-discovery engine.
- Quote ranking does not assess issuer quality, legal equivalence, availability to a particular person, or final execution cost.
- Public RPC and Jupiter rate limits can temporarily produce partial or unavailable rows.
- Process-local request throttling is not distributed rate limiting.
- No eligible tester transaction or confirmed receipt has been live-verified.

## Roadmap

1. Configure dedicated Solana RPC and Jupiter credentials for shared-demo reliability.
2. Separately close semantic transaction-flow validation before considering execution.
3. Complete an independently eligible, smallest-meaningful-amount supervised verification only with explicit authorization.
4. Add another asset only after issuer mappings and live Token-2022 normalization pass the registry checks.

## Sources and credits

Solana supplies the chain and Token-2022 infrastructure; Jupiter supplies routing; xStocks/Backed and Ondo supply the compared instruments and issuer data. Core dependencies include Next.js, React, Solana Web3.js, Solana Wallet Adapter, Decimal.js, Zod, TweetNaCl, and Vitest. See `package.json` and `package-lock.json` for exact versions.
