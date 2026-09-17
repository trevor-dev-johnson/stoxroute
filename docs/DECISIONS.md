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
