# StoxRoute Decision Log

The September 14 entries below preserve the previous working name and plan. The September 15 entries supersede them where stated.

This is an append-only record of decisions that would otherwise get relitigated or lost between sessions. Newer entries may supersede older ones, but do not silently rewrite history.

## 2026-09-14 — D001: Build an intent router, not a brokerage clone

**Decision:** StockRoute accepts company-level intent and compares tokenized representations.

**Reason:** Trading frontends already exist. Wrapper selection and execution comparison are the sharper Solana-native wedge.

**Consequence:** Every MVP screen must support the select -> compare -> execute -> prove loop. Generic brokerage features are out.

## 2026-09-14 — D002: Optimize for a five-day hackathon build

**Decision:** Use one Next.js/TypeScript repository, no separate backend service, database, or custom smart contract.

**Reason:** None of those components are necessary to prove the routing thesis, and each creates delivery risk.

**Consequence:** Server routes protect provider keys; wallet and chain provide identity and transaction history.

## 2026-09-14 — D003: Rank with measurable output, not a proprietary score

**Decision:** Recommend the route with the best comparable normalized exposure for the requested input, then display price impact and other route facts separately.

**Reason:** A composite issuer or quality score would be arbitrary and difficult to defend in five days.

**Consequence:** If routes cannot be normalized honestly, the UI must narrow the comparison or state the limitation.

## 2026-09-14 — D004: Use a small verified registry

**Decision:** Begin with one company and expand to at most three after the end-to-end loop works.

**Reason:** Verified mints, decimals, multipliers, restrictions, and live liquidity matter more than asset count.

**Consequence:** Hardcoded typed metadata is acceptable. Unverified candidates remain disabled.

## 2026-09-14 — D005: Use Jupiter Swap API V2 for live routes

**Decision:** Build new quote/execution work on Jupiter's current Swap API V2.

**Reason:** Jupiter documents Metis Swap V1 as deprecated/superseded.

**Consequence:** Examples or prior code using `/swap/v1/quote` must be treated as migration references, not the target design.

## 2026-09-14 — D006: Keep Backpack mint/redeem optional

**Decision:** Investigate Backpack's open securities mint/redeem API as a bonus primary-market adapter only after the Jupiter comparison loop works.

**Reason:** The announcement is highly relevant, but access requirements and exact semantics are not yet verified. Rebuilding the MVP around it would be reckless.

**Consequence:** The architecture allows a Backpack adapter, but no required user path depends on it.

## 2026-09-14 — D007: Respect product eligibility

**Decision:** Never bypass issuer, jurisdiction, KYC, or platform restrictions.

**Reason:** Tokenized equities are regulated products and eligibility differs across representations.

**Consequence:** The public demo may compare live routes while gating execution or using an eligible tester. Restrictions must be presented as product constraints, not hidden errors.

## Entry template

```md
## YYYY-MM-DD — D###: Short title

**Decision:**

**Reason:**

**Consequence:**

**Supersedes:** Optional decision ID.
```

## 2026-09-15 — D008: Rename to StoxRoute

**Decision:** Use StoxRoute in new product copy and source identifiers where appropriate. StockRoute is the historical name.

**Reason:** Trevor selected this name after reporting the .com was available. Ownership/deployment is still unverified.

**Consequence:** This handoff replaces the earlier planning pack while preserving the original decisions as history.

## 2026-09-15 — D009: Use the remaining three days

**Decision:** Work from September 15 to the fixed September 18, 4 PM Eastern close. Main track only.

**Reason:** The initial five-day estimate is no longer the remaining time budget. The optional bounties would require unrelated features.

**Consequence:** Follow BUILD-PLAN. Cut extra tickers before sacrificing the core or submission preparation.

**Supersedes:** D002's five-day framing, not its single-app architecture.

## 2026-09-15 — D010: NVIDIA, xStocks + Ondo, Jupiter quotes

**Decision:** Start with NVDAx and NVDAon. No Backpack adapter during the sprint.

**Reason:** Both issuers returned live NVIDIA quotes after normalization checks; all three tested Backpack candidates had zero supply. Provider choice follows working evidence, not preference.

**Consequence:** Do not repeat general issuer discovery. Tesla/SPY remain optional and disabled until their outstanding checks pass.

**Supersedes:** D006; narrows D004.

## 2026-09-15 — D011: Onchain normalization for both issuers

**Decision:** Read current Scaled UI state onchain for both, accounting for decimals and scheduled multiplier transitions. Never assume Ondo is one token per share-equivalent.

**Reason:** Both observed multipliers exceeded one and the xStocks old/new multiplier fields differed. Raw units would mislead.

**Consequence:** Use precise arithmetic, chain time, timestamped snapshots and fail-closed normalization. No reference-price feed is needed to rank same-ISIN exposure.

**Clarifies:** D003 and any older simplified formula missing the decimal divisor.

## 2026-09-15 — D012: Quote evidence is not execution evidence

**Decision:** Live comparison is the first deliverable; verified eligible execution remains the target MVP gate.

**Reason:** Only walletless orders have been tested. No simulated/signed/confirmed transaction exists in the evidence. The latest quote advantage was about 5.562 bps, not dramatic savings.

**Consequence:** No all-in or realized-savings claims, no false receipt, no claim that size alone caused a winner flip. Use clear quoted-exposure labels and finish fee/receipt verification in M3.

## 2026-09-15 — D013: Rate limits and freshness are product requirements

**Decision:** Manual comparison, amount presets, concurrent pairs, bounded retry, explicit partial/stale states. Obtain a developer key for dependable shared use if available.

**Reason:** Keyless calls succeeded but a 429 broke one pair. Old successful output must not be compared with a much newer retry.

**Consequence:** Keep scope small; do not continuously poll every preset or mislabel throttling as no liquidity.

## 2026-09-15 — D014: Supervised execution, no account system

**Decision:** Quote mode first; implement server-side supervised tester access and wallet proof for the execution demo without a database or user-account product.

**Reason:** An independently eligible tester has not been established. A config flag is not legal approval for public trading.

**Consequence:** Continue unblocked wallet engineering; keep execution off until its documented conditions are met. Do not buy for an ineligible person's benefit. Prepare an honest limited demo if the transaction gate cannot be finished.

**Clarifies:** D007.

## 2026-09-15 — D015: Stateless, fail-closed execution intents

**Decision:** Bind each supervised execution to a short-lived server-authenticated intent and the exact decoded transaction message. Require wallet proof before preparation, revalidate the wallet signature and message before submission, and derive successful receipts only from confirmed onchain balance deltas.

**Reason:** Client state, a claimed taker string, and quote output are not authorization or settlement evidence. The sprint does not need a database, but it does need tamper resistance and explicit uncertainty handling.

**Consequence:** Execution remains off by default and fails closed on disabled/misconfigured gates, origin mismatch, wallet change, expiry, registry/provider mismatch, altered transactions, simulation failure, or ambiguous submission. Process-local duplicate coalescing is not treated as durable state.

**Clarifies:** D012 and D014.

## 2026-09-16 — D016: Explain small route differences without calling them savings

**Decision:** Show the leading complete quote with three adjacent facts: additional share-equivalent exposure, relative basis-point advantage, and an approximate quote-implied value difference calculated from the winning route's quoted USDC-per-share-equivalent.

**Reason:** Judges and users should understand the scale of a difference in seconds, but no purchase or realized saving has occurred.

**Consequence:** The UI labels the dollar figure as quote-implied, places estimate/restriction copy beside it, and withholds all three winner facts for partial or stale rounds.

**Clarifies:** D012.

## 2026-09-17 — D017: Harden the public HTTP boundary before deployment

**Decision:** Enforce JSON media type and actual streamed-body limits on every mutation route, add a small process-local quote burst limit, discard obsolete client quote responses, and ship production security headers that preserve Wallet Standard popup compatibility.

**Reason:** `Content-Length` is client-controlled, overlapping comparisons can otherwise present an older response, and a public financial-routing demo needs explicit browser and abuse-resistance defaults.

**Consequence:** Oversized or non-JSON requests fail before domain handling, stale concurrent responses cannot overwrite the active round, and the Vercel deployment is hardened without treating an in-memory limiter as distributed enforcement. `Cross-Origin-Opener-Policy` remains `same-origin-allow-popups` so wallet connection flows are not broken.

## 2026-09-18 — D018: Expand walletless utility through a bounded verified scanner

**Decision:** Add issuer-verified NVDA, TSLA, and SPY pairs to one validated registry and scan them sequentially while fetching the two routes inside each pair concurrently. Stream progress, isolate asset failures, and rank only complete fresh pairs.

**Reason:** The normalization engine is useful across equivalent issuer pairs, but uncontrolled parallel requests would increase Jupiter throttling and a partial result must never become a false market-wide winner.

**Consequence:** The primary workflow is one budget to a ranked Opportunity Board, with the existing per-asset detail preserved. The display window is 30 seconds, cached mint state is labeled, quote-implied dollar differences remain estimates, and all expanded routes remain walletless while execution stays server-disabled.

**Supersedes:** D010 only as the walletless comparison scope; it does not broaden the NVIDIA-only execution allowlist.

## 2026-09-19 — D019: Make a selected asset the primary workflow

**Decision:** Lead with registry-bounded ticker/company search, a curated featured-market shortcut, and one exact-USDC comparison for the selected asset. Keep the three-asset Opportunity Board as an explicit secondary scan.

**Reason:** A user should be able to answer “which route is better for the stock I want?” without first interpreting a market-wide ranking. The scan remains useful for discovery but is not the clearest entry point.

**Consequence:** No quote runs until a supported asset is chosen and submitted. Changing the asset or amount clears and aborts the prior comparison. Only a complete fresh pair can show a leading route or become an execution candidate; partial, stale, and provider-error states retain their existing semantics. Featured markets are curated registry shortcuts, not popularity or investment rankings.

**Clarifies:** D016 and D018. The API, normalization, Jupiter, wallet, and server-disabled execution boundaries are unchanged.

## 2026-09-19 — D020: Public product is comparison-only; registry additions require two live routes

**Decision:** Remove wallet, tester, signing, and execution controls from the public page while retaining the fail-closed server infrastructure and its tests. Expose route inspection through non-transactional details and use one footer sentence: “Trading execution is not currently available.” Expand the runtime registry only when official xStocks and Ondo data agree on underlying ISIN and ticker, both official Solana mints pass coherent onchain validation, and both Jupiter routes return positive matching quotes in the same verification pass.

**Reason:** Internal execution readiness was obscuring the usable product today. Ticker-only joins and one-sided quote availability are also too weak for a financial comparison registry.

**Consequence:** The public journey ends at route details. AAPL, MSFT, META, AMZN, GOOGL, and QQQ join the previously verified NVDA, TSLA, and SPY pairs. COIN, PLTR, NFLX, and GLD remain excluded for the documented identity or live-route failures. `scripts/verify-asset-registry.mjs` makes the evidence gate repeatable without turning historical observations into runtime fallbacks.

**Clarifies:** D015 and D019. Execution endpoints, wallet components, validation, and security controls remain in the repository but are not imported by the public page.

## 2026-09-20 — D021: Answer-first public comparison with independent display freshness

**Decision:** Frame the public product around one compact asset-and-budget question, present the computed winner and advantage before the issuer cards, use contextual estimated-exposure language in the default view, and keep technical normalization evidence inside route details. Preserve displayed quote values and the winner as they age; show a non-blocking timestamp immediately and a light “may no longer reflect current routing” warning after two minutes.

**Reason:** The prior hero, featured-market cards, selected-asset summary, dense route metrics, and 30-second stale failure state made a simple walletless comparison feel like an operations console. Public quote inspection and future transaction authorization have different freshness needs.

**Consequence:** Popular tickers are compact shortcuts rather than promotional cards, the nine-market scanner is a secondary action, cards round exposure to five decimals while details retain full precision, and public display age no longer changes a valid historical result into a failure. The existing 30-second execution intent boundary, quote calculations, registry, backend validation, and server-disabled execution gate are unchanged.

**Clarifies:** D016, D019, and D020. It supersedes D018 only for public display-freshness treatment.
## 2026-09-23 — D022: Retire bulk opportunity scanning from the public product

**Decision:** Make selected-asset comparison the only live quote-fetching path. Remove the bulk action and Opportunity Board, replace them with a read-only disclosure of registry metadata, and make the former `/api/opportunities` endpoint return HTTP 410 without invoking Solana or Jupiter.

**Why:** A nine-asset pass produced eighteen Jupiter requests, exhausted shared provider limits, and made healthy selected-asset comparisons look unreliable. The core user question is about one chosen stock or ETF, not market-wide discovery.

**Consequence:** One Compare action requests exactly the selected asset's two issuer routes. Search, popular shortcuts, registry verification, precise normalization, honest partial/rate-limit/provider errors, and the hidden server-disabled execution infrastructure remain intact. D018's scanner direction and the scanner portions of D019/D021 are superseded.
