# StoxRoute submission kit

Updated: 2026-09-19. This copy reflects the asset-first walletless comparison and nine-asset secondary scanner. Trading execution is not part of the public product flow.

## Concise submission description

StoxRoute is a walletless issuer-route comparison tool for tokenized stocks on Solana. Choose one of nine verified stocks or ETFs, set one USDC budget, and compare its xStocks/Ondo routes after normalizing live Jupiter output with current Token-2022 multiplier state. Partial failures, issuer identity, freshness, routers, and restrictions stay visible. A secondary scan ranks only complete fresh pairs.

## Short tagline

One budget. Every verified pair.

## Suggested category

Main track — Trading / Infrastructure.

## 60–90 second demo script

**0:00–0:08 — Problem**
“Equivalent tokenized stocks can use different decimals and onchain multipliers, so raw token counts—and ticker similarity—are not enough to compare routes.”

**0:08–0:20 — Product**
“StoxRoute lets you choose a verified market, gives both issuer routes the same USDC budget, and converts each live output into normalized underlying exposure. No wallet is needed.”

**0:20–0:38 — Live comparison**
"I’ll use the one-thousand-dollar preset. The board reports progress across all nine verified markets using live Jupiter quotes and current confirmed mint state—not stored demo data."

**0:38–0:56 — Explain the verdict**
“Complete pairs rank by relative basis-point advantage, or I can sort by quote-implied dollar difference. Partial rows stay visible but are never called winners. I’ll select one row to inspect both normalized issuer routes.”

**0:56–1:08 — Inspectability**
“The detail shows the actual issuer, underlying ISIN, mint, raw output, multiplier, router, included fee facts, cache status, and quote timestamp.”

**1:08–1:20 — Safety and status**
“Trading execution is not currently available. This demo is a live route comparison, not a transaction.”

**1:20–1:28 — Close**
“StoxRoute turns one budget into an honest, inspectable view of tokenized-stock route differences.”

## Recording checklist

- Use a fresh desktop browser window at 1440×1000 or similar.
- Confirm `EXECUTION_ENABLED=false` remains configured; there is no public wallet action.
- Start on the empty state, then choose `$1,000` and run one fresh scan.
- Record the live result that actually appears; never script a particular winner.
- Sort the board, select one complete row, expand one route's instrument details, and select the leading route.
- Pause briefly on the restrictions notice and the single footer execution disclosure.
- Avoid API keys, terminal windows, browser extensions, bookmarks, personal notifications, or eligibility records.
- Export at 1080p, check audio, and verify every linked artifact in a signed-out session.

## Remaining submission links

- Repository: `https://github.com/trevor-dev-johnson/stoxroute`
- Live demo: `https://stoxroute.vercel.app`
- Demo video: pending recording/upload
- Hackathon project page and confirmation: pending Trevor registration/submission

## Accuracy disclosure

The live comparison, normalization, registry verification, and failure handling are the public product. Server-side wallet proof, execution gates, transaction validation, simulation adapters, and receipt accounting remain preserved and tested but are not exposed in the public flow. No live taker-specific order or mainnet transaction has been completed. Quotes are estimates; tokenized assets may carry issuer, liquidity, eligibility, transfer, and jurisdiction restrictions.
