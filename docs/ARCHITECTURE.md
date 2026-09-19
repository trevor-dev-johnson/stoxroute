# Architecture and comparison contract

Updated: 2026-09-19. This document describes the implemented asset-first walletless comparison, secondary scanner contract, and separately gated execution boundary.

## Stack

| Concern | Choice |
|---|---|
| App | Next.js App Router + TypeScript, one repository |
| UI | Tailwind; shadcn/ui components only where useful |
| Wallet | Solana Wallet Adapter / Wallet Standard; Phantom first, other compatible wallets |
| Solana client | `@solana/web3.js` if the repository has no existing compatible choice |
| Quotes and execution | Jupiter Swap V2 |
| Mint state | Solana JSON-RPC with `jsonParsed`, confirmed commitment |
| Arithmetic | Integer strings/BigInt for base units; `decimal.js` for financial calculations |
| Boundary validation | Zod or an already-installed equivalent |
| Tests | Vitest for domain/adapter tests; focused browser checks for the main flow |
| Hosting target | Vercel; no deployment performed by this handoff |
| Persistence | None required for MVP |

Keep any compatible existing versions. On a new app, choose a mutually supported stable Node/Next/React set, commit the resulting lockfile when appropriate, and record actual versions in STATUS. Do not guess exact versions from this pack or add a separate service just to use another language.

## Module boundaries

| Suggested path | Responsibility |
|---|---|
| `src/app/page.tsx` | Asset search/selection, one-market comparison, and secondary Opportunity Board |
| `src/app/api/opportunities/route.ts` | Stream bounded scan progress and isolated asset results |
| `src/app/api/quotes/route.ts` | Validate supported ticker/input and return normalized quote round |
| `src/app/api/order/route.ts` | Gated, fresh transaction preparation |
| `src/app/api/execute/route.ts` | Validate signed intent and forward to execution provider |
| `src/components/` | Amount input, issuer comparison, wallet review, receipt |
| `src/lib/stocks/registry.ts` | Explicit supported company/issuer/mint mapping |
| `src/lib/solana/mint-state.ts` | Confirm mint type, owner, decimals, supply, extensions and chain time |
| `src/lib/providers/jupiter.ts` | HTTP calls, runtime schemas, provider errors, timestamps |
| `src/lib/routing/normalize.ts` | Base units → token units → share-equivalent exposure |
| `src/lib/routing/compare.ts` | Comparable-round checks and deterministic ranking |
| `src/lib/routing/opportunities.ts` | Concurrency control, failure isolation, dollar calculation, and board sorting |
| `src/lib/ui/asset-search.ts` | Registry-bounded ticker and company-name search |
| `src/lib/routing/fees.ts` | Quoted cost interpretation and explicit unknowns |
| `src/lib/execution/` | Gating, transaction intent binding, signing payload, confirmation |
| `tests/` | Domain, failure and execution-boundary tests |

Match existing directories if already established. This is not permission to rewrite working code. No generalized plugin/provider framework is needed: one small registry, one mint reader and one Jupiter adapter are sufficient.

## Registry

The runtime registry contains three independently reverified pairs: NVIDIA (NVDAx/NVDAon), Tesla (TSLAx/TSLAon), and SPDR S&P 500 ETF (SPYx/SPYon). Every pair has the same issuer-declared underlying ISIN. Exact issuer sources and the 2026-09-18 live mint verification are recorded in [ASSET-REGISTRY.md](ASSET-REGISTRY.md).

Registry fields include underlying ticker/name/ISIN and instrument type, issuer, token symbol, mint, expected decimals, official source, and verification date. Module-load validation rejects duplicate tickers, symbols or mints, duplicate issuers inside a pair, candidate/asset identity mismatches, and incomplete pairs. Execution eligibility remains separate from comparison availability; the expanded assets are walletless comparison routes only.

## Numeric definitions

For every supported representation, the onchain Scaled UI configuration provides the normalized-underlying conversion. [xStocks multiplier guide](https://docs.xstocks.fi/developers/multipliers) and [Ondo pricing explanation](https://docs.ondo.finance/ondo-stocks/token-and-quote-pricing).

```text
rawInputUSDC = exact decimal USDC amount × 10^6
tokenUnits = rawOutputBaseUnits / 10^mintDecimals
normalizedUnderlyingExposure = tokenUnits × activeMultiplier
quotedUSDCPerNormalizedUnit = requestedUSDC / normalizedUnderlyingExposure
relativeExposureAdvantageBps = (higherExposure / lowerExposure - 1) × 10000
```

All monetary quantities crossing JSON boundaries are strings. Reject zero, negative, non-finite, malformed, scientific-notation and overprecision amount input; allow at most six decimal places for USDC. Set a documented comparison input range initially of 1–10,000 USDC; a valid input does not guarantee a route or an executable order.

Use decimal strings at ≥40 significant digits for domain arithmetic. Never turn raw token output into JS `Number`, sort rounded values, or multiply a previously scaled `uiAmount` again. The onchain multiplier itself is a protocol floating-point value; extra calculation precision prevents additional loss but does not imply perfect measurement of equity value.

Normalized underlying exposure is an economic comparison unit. It is not a transferable ordinary share, ETF share, or a statement that both issuers grant identical rights.

## Active multiplier and time

Read both mints in the same `getMultipleAccounts` request. Retain context slot and fetch its block time; use that chain time when resolving the multiplier. If the time is unavailable/stale or a scheduled transition is ambiguous during the quote round, refresh or mark normalization unavailable.

Select `newMultiplier` when the chain time reaches `newMultiplierEffectiveTimestamp`; otherwise use `multiplier`. Retain both values and the effective timestamp. The active field depends on time; a timestamp may be in the past. [Solana integration guide](https://solana.com/docs/tokens/extensions/scaled-ui-amount/integration-guide).

Mint state can be cached for at most 60 seconds, never across a known multiplier transition; responses expose whether state was `live` or `cached`, and execution always refreshes. Confirmed block time more than 120 seconds behind or 60 seconds ahead of server wall time is rejected. Missing/duplicate scaled configuration, invalid/nonpositive multiplier, wrong owner/type/mint, mismatched metadata, uninitialized or paused mint fail closed.

## Quote round

1. Validate a supported ticker and exact input amount. Do not allow arbitrary mints or upstream URLs.
2. Load verified, fresh normalization state for both candidates.
3. Launch both quote requests together with a shared comparison ID; record request-start and response-finish timestamps independently.
4. Validate input/output mints, ExactIn mode, input amount, positive output and provider error fields. Normalize each successful result.
5. Apply round freshness/skew rules. Return every candidate, including structured failure reasons.
6. Rank only a complete, current, comparable pair. Show a partial result without a cross-issuer winner.

Implemented policy: 8-second HTTP timeout, at most one bounded retry honoring `Retry-After` up to two seconds, 2-second maximum spread between response completion times, and a 30-second display window. A throttle refreshes the entire pair so a new quote is never compared with a stale sibling.

The opportunity scan is bounded to the supported registry and processes one asset at a time; its two issuer quotes run concurrently. The NDJSON response emits a start event, one event per completed asset, and a final scan summary. One asset failure never aborts the others. Complete pairs sort by exact basis-point advantage by default or exact quote-implied dollar advantage on request; partial/unavailable rows stay visible but sort below complete comparisons.

Disable the Compare button while a round runs, debounce editing, and discard late results for an obsolete input/request ID. Use manual refresh initially. Deduplicate identical in-flight requests as an optimization; do not rely on process memory for correctness across serverless instances. Never continuously poll six quotes for the three presets.

Jupiter's plan limits are shared; the documented keyless tier was 30 requests/minute and the free-key tier 60 on the check date. A key is recommended for deployment. Respect throttles rather than rotating keys. [Rate limits](https://developers.jup.ag/docs/portal/rate-limits).

## Jupiter contract

Use `https://api.jup.ag/swap/v2/order` with `inputMint`, `outputMint`, `amount`, and optional server-side `x-api-key`. The spike worked without a key. Omit `taker` for comparison; add the connected wallet for an order. Walletless pricing does not provide a signable transaction. [Order API](https://developers.jup.ag/docs/api-reference/swap/order).

Keep the provider schema permissive for additional fields but strict for amounts/mints/error semantics. Preserve raw JSON in local diagnostic fixtures when useful, not in public logs. Do not force slippage, payer, router or referral overrides in the default comparison; optional parameters can change route eligibility. [Order and Execute guide](https://developers.jup.ag/docs/swap/order-and-execute).

Represent errors separately: `rate_limited`, `timeout`, `no_route`, `provider_error`, `malformed_response`, `normalization_unavailable`, `stale_round`. Successful HTTP status alone is insufficient. Detect the presence of error fields, including zero-valued numeric codes where relevant; do not test only JavaScript truthiness.

## Fees and honest ranking

Jupiter documents platform fees as incorporated into its quote; do not subtract a percentage again from output. `feeBps` and `platformFee.feeBps` are not automatically additive. Actual `/execute` totals distinguish wallet debits/credits from swap-route amounts. [Fee and receipt semantics](https://developers.jup.ag/docs/swap/order-and-execute).

Implementation requirements:

- Preserve `feeMint`, both fee-rate fields, any actual fee amount, network/priority/rent estimates, and gasless state. Missing is unknown, not zero.
- Label M1/M2 ranking **best quoted exposure for this input**, with network/wallet-cost limitations explicit. Do not label it “all-in cheapest” until the fee adapter verifies the actual debit/credit semantics.
- Validate equal input budgets. Do not adjust the input a second time based on a rate unless current API evidence requires it.
- If a router returns different or uninterpretable fee treatment, withhold an all-in cost conclusion and record the unresolved case. Show cost estimates separately rather than subtracting lamports from token output.
- The 10,000 USDC evidence reported identical 10-bps USDC fees and zero lamport charges in walletless quotes. Do not assume every wallet/order is gasless or has zero account-creation costs.
- Test fee handling against a freshly built order and eventual receipt. Use actual debits/credits for the receipt; quote outputs remain estimates.

## Winner labels

If both candidates are comparable, use maximum share-equivalent output for the same input. For exact ties show equal; below a configured **1 bp** difference show “nearly equal” rather than implying a meaningful saving. Keep an internal deterministic sort without pretending it is issuer advice. This threshold is a UI decision, not a claim about error bounds.

Prefer percentage and additional share-equivalent exposure. If a monetary equivalent is ever added, disclose the reference and time and label it illustrative; do not call the foregone route a realized saving. No underlying stock price feed is required to rank two wrappers of the same ISIN.

## Implemented M3 execution boundary

Quote mode remains independent of wallet state. The client discovers installed Wallet Standard wallets through Wallet Adapter, while every preparation/submission mutation is independently protected on the server by the exact `EXECUTION_ENABLED` switch, optional configured allowlist, same-origin check, bounded body, short-lived challenge, and Ed25519 wallet proof.

All JSON API routes require `application/json` and enforce limits against the bytes actually read from the request stream. The public quote route also applies a small process-local burst limit to reduce accidental abuse. That limiter is defense in depth only: serverless instances do not share memory, so provider quotas and platform-level controls remain the durable boundary. Production responses set a restrictive content policy plus anti-framing, MIME-sniffing, referrer, permissions, opener, and transport-security headers; wallet popups remain compatible through `same-origin-allow-popups`.

Preparation never consumes evidence fixtures. It converts the reviewed decimal USDC amount to exact base units, refreshes both supported mint states, requests a new taker-specific Jupiter order, and requires matching input mint, output mint, base-unit input, taker, and registry issuer/symbol. The returned versioned transaction is decoded, lookup tables are resolved, the reviewed wallet must be a signer, both reviewed mints must be referenced, and simulation must pass before the transaction is exposed to the browser.

The 30-second authenticated intent includes issuer, symbol, both mints, input amount, expected/minimum normalized exposure, comparison and order request IDs, wallet, router, expiry/block height, and hashes of both the message and original unsigned transaction. Submission accepts only the unchanged message signed by that wallet, repeats expiry/block-height and simulation checks, and requires Jupiter's returned signature to match the wallet-signed transaction. In-process duplicate coalescing is an optimization only; retries reuse the same Jupiter request ID and signed transaction and never prepare a replacement order implicitly.

Receipt tokens identify the submitted signature and expected wallet/mints. A receipt becomes `confirmed` only after confirmed Solana transaction metadata shows a positive wallet USDC debit and selected-token credit. Jupiter's reported totals remain diagnostic provider fields, not receipt values. Live confirmation behavior is still unverified until an eligible tester authorizes and funds a mainnet transaction.
