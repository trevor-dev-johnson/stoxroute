# StoxRoute submission kit

Updated: 2026-09-18. This copy reflects the multi-asset walletless scanner and implemented-but-disabled execution infrastructure. Do not add a transaction claim unless a real eligible tester transaction is confirmed.

## Concise submission description

StoxRoute is a walletless opportunity scanner for equivalent tokenized stocks on Solana. One USDC budget scans verified xStocks/Ondo pairs for NVIDIA, Tesla, and SPY, normalizes live Jupiter output with current Token-2022 multiplier state, and ranks only complete fresh pairs by basis-point or quote-implied dollar advantage. Partial failures, issuer identity, freshness, routers, and restrictions stay visible. Execution is fail-closed and disabled.

## Short tagline

One budget. Every verified pair.

## Suggested category

Main track — Trading / Infrastructure.

## 60–90 second demo script

**0:00–0:08 — Problem**
“Equivalent tokenized stocks can use different decimals and onchain multipliers, so raw token counts—and ticker similarity—are not enough to compare routes.”

**0:08–0:20 — Product**
“StoxRoute gives every verified issuer pair the same USDC budget, converts each live output into normalized underlying exposure, and ranks the complete comparisons. No wallet is needed.”

**0:20–0:38 — Live comparison**
“I’ll use the one-thousand-dollar preset. The board reports progress as it scans NVIDIA, Tesla, and SPY using live Jupiter quotes and current confirmed mint state—not stored demo data.”

**0:38–0:56 — Explain the verdict**
“Complete pairs rank by relative basis-point advantage, or I can sort by quote-implied dollar difference. Partial rows stay visible but are never called winners. I’ll select one row to inspect both normalized issuer routes.”

**0:56–1:08 — Inspectability**
“The detail shows the actual issuer, underlying ISIN, mint, raw output, multiplier, router, included fee facts, cache status, and quote timestamp.”

**1:08–1:20 — Safety and status**
“The Wallet Standard review and transaction-validation path is implemented, but purchasing is server-disabled until an independently eligible tester completes verification. No transaction is implied here.”

**1:20–1:28 — Close**
“StoxRoute turns one budget into an honest, inspectable view of tokenized-stock route differences.”

## Recording checklist

- Use a fresh desktop browser window at 1440×1000 or similar.
- Confirm `EXECUTION_ENABLED=false` and do not connect or reveal a personal wallet.
- Start on the empty state, then choose `$1,000` and run one fresh scan.
- Record the live result that actually appears; never script a particular winner.
- Sort the board, select one complete row, expand one route's instrument details, and select the leading route.
- Pause briefly on the restrictions notice and disabled execution state.
- Avoid API keys, terminal windows, browser extensions, bookmarks, personal notifications, or eligibility records.
- Export at 1080p, check audio, and verify every linked artifact in a signed-out session.

## Remaining submission links

- Repository: `https://github.com/trevor-dev-johnson/stoxroute`
- Live demo: `https://stoxroute.vercel.app`
- Demo video: pending recording/upload
- Hackathon project page and confirmation: pending Trevor registration/submission

## Accuracy disclosure

The live comparison, normalization, failure handling, Wallet Standard discovery, server execution gate, signed intent checks, transaction validation, simulation adapters, and receipt accounting are implemented. A live taker-specific order and mainnet execution remain unverified. Quotes are estimates; tokenized assets may carry issuer, liquidity, eligibility, transfer, and jurisdiction restrictions.
