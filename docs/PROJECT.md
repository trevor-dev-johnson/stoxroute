# StoxRoute product and MVP

Updated: 2026-09-15. Canonical brand: **StoxRoute**. “StockRoute” is the previous working name.

## Product

**Compare tokenized versions of the same stock on Solana and find the strongest quoted exposure for a USDC budget.**

Working headline: **One stock. Compare your routes.** Supporting copy: “Compare tokenized NVIDIA across issuers before you buy.” The product offers tokenized economic exposure; avoid copy suggesting direct stock ownership or equal legal rights.

The initial user already has USDC on Solana and wants NVIDIA exposure. They should not have to calculate decimals, dividend multipliers, and competing token outputs by hand. Live testing established that the two representations can have different normalized quote outputs; it has not established large savings, market size, or customer demand.

The distinct work is company-to-instrument selection and normalization. Jupiter supplies routes to a chosen token. StoxRoute compares which supported tokenized representation gives the most quoted exposure for this input. This is a small, useful layer, not a claim that Jupiter cannot route trades or that no competitor exists.

## Scope tiers

| Tier | Included | Completion standard |
|---|---|---|
| First runnable slice | NVIDIA, NVDAx/NVDAon, USDC, live comparison and failure states | A real quote pair is normalized and explained on screen |
| Target hackathon MVP | Asset-first walletless comparison plus a read-only verified registry | Every supported pair passes issuer identity, live mint-state, and two-route quote verification |
| Current expansion | NVDA, TSLA, SPY, AAPL, MSFT, META, AMZN, GOOGL, and QQQ | Exact official-source overlap plus positive live routes |
| Deferred | Everything listed under non-goals | Do not spend the sprint on it |

Quote mode is useful and can be demonstrated honestly if execution remains blocked. It is not the same as completing the trading MVP. Do not present mocked confirmation as a real trade.

## Required user journey

1. Open the walletless comparison and choose one of the nine verified stocks or ETFs.
2. Enter a USDC amount or choose **100 / 1,000 / 10,000**. Use a Compare button; presets may submit one request. Do not fetch on every keystroke.
3. Fetch both quotes as one comparison round. Display the actual issuer/token and estimated NVIDIA share-equivalent exposure.
4. If both are current and comparable, explain the larger exposure and the percentage difference. If costs are unresolved, explicitly limit the comparison to quote output before unverified wallet costs.
5. Allow the user to inspect the issuer, mint, fees, multiplier state, router, and restrictions. The “best quoted exposure” label is not a judgment about legal rights or issuer safety.
6. Let users browse supported registry metadata without requesting quotes, and disclose once in the footer that trading execution is not currently available.

## Screen specification

A single responsive page is enough. Dark navy/charcoal background, legible light text, one teal/green accent, clear numeric alignment. Use text, existing icons and CSS; no custom illustration work is required.

| Area | Content |
|---|---|
| Header | StoxRoute and current network; no wallet or transaction action |
| Input | Searchable verified-asset picker, USDC amount field, Compare button, and compact popular-ticker shortcuts |
| Comparison | Two issuer cards on mobile or an aligned table on desktop |
| Answer | Winner first, additional contextual exposure, percentage advantage, quote-implied difference, and non-blocking age |
| Primary route fields | Issuer, symbol, estimated underlying exposure, unit cost, and router |
| Supporting details | Raw token amount, multiplier/source time, mint, router, fees, minimum output when supplied |
| Action | Refresh quote or expand **View details** for either issuer |

Required public states: idle; fetching; both available; tie/near-tie; only one available; both unavailable; normalization unavailable; rate limited; and over-two-minute age warning.

The existing server-disabled wallet and execution infrastructure remains maintained and tested outside the public product flow. Its separate engineering contract is documented in [EXECUTION.md](EXECUTION.md).

Show “not supplied” for missing route details, not invented liquidity or zero price impact. No green winner badge when only one issuer answered. Preserve prior results during refresh. Public comparisons keep their displayed values and winner, show a non-blocking age, and add a light warning after two minutes; the separate execution path keeps its strict short-lived gate.

Use keyboard-accessible controls, visible focus, labeled inputs, sufficient contrast and small-screen layouts. Numeric display can round to 6–8 places, while comparison keeps full precision. For tiny differences use percentages/share-equivalents, not inflated dollar claims.

## Non-goals

No user accounts, database, portfolio/history dashboard, charts, news, AI picks, automated issuer-quality score, social/copy trading, DCA, limits, alerts, sell/migration flow, leverage, borrowing, yield, mobile-native app, custom Solana program, direct issuer mint/redeem, referral revenue or token launch. No Meteora DBC or Clawpump bounty work.

The success test is one understandable live loop. More supported tickers are optional; correctness, honest errors and a defensible demonstration matter more.
