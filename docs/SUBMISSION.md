# StoxRoute submission kit

Updated: 2026-09-23. This copy reflects the answer-first, selected-asset walletless comparison and read-only supported-market registry. Trading execution is not part of the public product flow.

## Concise submission description

StoxRoute is a walletless issuer-route comparison tool for tokenized stocks on Solana. Choose one of nine verified stocks or ETFs, set one USDC budget, and compare its xStocks/Ondo routes after normalizing live Jupiter output with current Token-2022 multiplier state. Partial failures, issuer identity, freshness, routers, and restrictions stay visible. The supported-market registry can be browsed without generating live quote traffic.

## Short tagline

One asset. Every verified route.

## Suggested category

Main track — Trading / Infrastructure.

## 60–90 second demo script

**0:00–0:08 — Problem**
“The same stock can have multiple tokenized versions on Solana, and raw token counts do not tell you which route gives more underlying exposure.”

**0:08–0:18 — Select the asset**
“StoxRoute compares verified xStocks and Ondo routes without requiring a wallet. I’ll choose Apple and use a one-thousand-USDC budget.”

**0:18–0:30 — Compare**
“When I select Compare, both issuer routes receive the same input. StoxRoute combines fresh Jupiter output with each token’s current Token-2022 multiplier.”

**0:30–0:48 — Explain the live answer**
“The result names whichever issuer is actually ahead right now. Here is the additional Apple exposure, the percentage advantage, and the quote-implied value difference. I’m describing the live result—not scripting a winner.”

**0:48–1:03 — Inspect the route**
“View details keeps the technical evidence available: issuer, underlying ISIN, exact mint, full-precision output, multiplier, router, included fee facts, and quote time.”

**1:03–1:17 — Limits**
“These are quote estimates, not guaranteed execution or stock ownership. Issuer rights, liquidity, eligibility, transfer rules, and jurisdiction can differ.”

**1:17–1:25 — Close**
“Trading execution is not currently available. StoxRoute turns one budget into an honest, inspectable route comparison.”

Optionally open **Browse supported markets** for a brief, quiet shot of the verified registry. It does not request additional live quotes.

## Recording checklist

- Use a fresh desktop browser window at 1440×1000 or similar.
- Confirm `EXECUTION_ENABLED=false` remains configured; there is no public wallet action.
- Start on the empty state, choose Apple or the healthiest verified asset, enter `$1,000`, and select **Compare**.
- Record the live result that actually appears; never script a particular winner.
- Expand **View details** on one route and pause on the issuer, mint, multiplier, router, and quote time.
- Optionally open **Browse supported markets** to show the nine verified pairs without creating provider traffic.
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
