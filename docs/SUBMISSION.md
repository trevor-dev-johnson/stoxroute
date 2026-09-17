# StoxRoute submission kit

Updated: 2026-09-16. This copy reflects the verified walletless comparison and implemented-but-disabled execution infrastructure. Do not add a transaction claim unless a real eligible tester transaction is confirmed.

## Concise submission description

StoxRoute helps Solana users compare tokenized representations of the same company before choosing a route. For an equal USDC budget, it fetches current Jupiter quotes for NVDAx and NVDAon, reads each mint's live Token-2022 Scaled UI multiplier, and converts output into comparable NVIDIA share-equivalent exposure. The interface makes issuer identity, freshness, fees, route failures, and small differences explicit. Walletless comparison is live; a fail-closed Wallet Standard execution and confirmed-receipt path is implemented but remains disabled pending eligible tester verification.

## Short tagline

Compare the exposure, not the token count.

## Suggested category

Main track — Trading / Infrastructure.

## 60–90 second demo script

**0:00–0:08 — Problem**
“There are multiple tokenized versions of NVIDIA on Solana, but their raw token counts are not directly comparable because decimals and onchain multipliers differ.”

**0:08–0:20 — Product**
“StoxRoute gives both issuer routes the same USDC budget and compares normalized NVIDIA share-equivalent exposure. It works without connecting a wallet.”

**0:20–0:38 — Live comparison**
“I’ll use the one-thousand-dollar preset and fetch both routes together. These are live Jupiter quotes using current confirmed mint state—not stored demo data.”

**0:38–0:56 — Explain the verdict**
“The leading route is labeled here. In one line I can see the additional share-equivalent exposure, its approximate quote-implied value, and the relative basis-point difference. If either route fails or the round expires, StoxRoute refuses to declare a winner.”

**0:56–1:08 — Inspectability**
“I can inspect the actual issuer, token mint, raw output, multiplier, router, included fee facts, and quote timestamp before choosing a route.”

**1:08–1:20 — Safety and status**
“The Wallet Standard review and transaction-validation path is implemented, but purchasing is server-disabled until an independently eligible tester completes verification. No transaction is implied here.”

**1:20–1:28 — Close**
“StoxRoute is a focused Solana comparison layer: equal budget in, understandable tokenized-stock exposure out.”

## Recording checklist

- Use a fresh desktop browser window at 1440×1000 or similar.
- Confirm `EXECUTION_ENABLED=false` and do not connect or reveal a personal wallet.
- Start on the empty state, then choose `$1,000` and run one fresh comparison.
- Record the live result that actually appears; never script a particular winner.
- Expand one route's instrument details and select the leading route.
- Pause briefly on the restrictions notice and disabled execution state.
- Avoid API keys, terminal windows, browser extensions, bookmarks, personal notifications, or eligibility records.
- Export at 1080p, check audio, and verify every linked artifact in a signed-out session.

## Remaining submission links

- Repository: `https://github.com/trevor-dev-johnson/stoxroute`
- Live demo: pending deployment
- Demo video: pending recording/upload
- Hackathon project page and confirmation: pending Trevor registration/submission

## Accuracy disclosure

The live comparison, normalization, failure handling, Wallet Standard discovery, server execution gate, signed intent checks, transaction validation, simulation adapters, and receipt accounting are implemented. A live taker-specific order and mainnet execution remain unverified. Quotes are estimates; tokenized assets may carry issuer, liquidity, eligibility, transfer, and jurisdiction restrictions.
