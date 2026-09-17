# Stocklana requirements and submission

Checked: **2026-09-15** against the [official Stocklana page](https://hackathons.solana.com/hackathons/stocklana). Recheck that page when submitting; do not infer new requirements from prize marketing.

## Official requirements

| Item | Current rule |
|---|---|
| Deadline | Friday Sep 18, 2026, 4:00 PM Eastern = 20:00 UTC |
| Judging | Through Oct 2, 2026 |
| Main track | $100,000, awarded by Solana Foundation |
| Current total displayed | $110,000 including two $5,000 bounties |
| Theme | Improve use/ownership of tokenized stocks on Solana; focus on one problem |
| Assessment | Real user/problem, working end-to-end demo, reason for Solana, execution quality |
| Entry | Individuals or teams; one submission per team; original work |
| Dependencies | Open-source components allowed with disclosure |
| Submission | Register, then submit before close; include at least one GitHub, demo or video link |
| Edits/team | Edits until close; invite teammates via form |

Main-track rules do not expressly require a custom contract, token launch, DBC integration, AI, mobile app, or a mainnet transaction. The mainnet emphasis appears in the Meteora bounty description. Our completed-transaction target strengthens the end-to-end demonstration; it is not an invented universal eligibility rule. [Official rules and bounty descriptions](https://hackathons.solana.com/hackathons/stocklana).

## Track decision

**Main track only.** StoxRoute fits Trading and Infrastructure through issuer comparison, normalization and routing UX. The optional Meteora bounty calls for substantive DBC use; the Clawpump bounty requires a launched token with a stock-paired pool using its specified infrastructure. StoxRoute currently satisfies neither, and neither is necessary to enter the main track.

## How the app supports judging

| Judge concern | Evidence to demonstrate |
|---|---|
| Who needs it? | USDC holder choosing among tokenized representations of NVIDIA |
| What problem? | Different token units/multipliers and quote outputs make manual comparison misleading |
| Why Solana? | Both issuer mints and routed liquidity coexist on the same network |
| Original work? | Registry validation, current exposure normalization, comparison/freshness logic, error handling and purchase UX |
| Working result? | Real concurrent quotes; then eligible-wallet flow and receipt if verified |
| Product quality? | Clear costs/issuer identity, small differences shown honestly, graceful failures |

No claimed uniqueness/market leadership, guaranteed savings or invented proprietary scoring. Credit Jupiter for routing/execution, issuers for instruments/data, Solana for the chain and token infrastructure, and the actual open-source packages used. Follow dependency licenses. Open-source dependency disclosure does not itself force the project's own license; record the chosen license rather than implying it was already selected.

## Submission checklist

- [ ] Registration confirmed; correct account/team selected.
- [ ] Project title **StoxRoute** and concise description entered.
- [ ] At least one required link exists and is accessible to judges.
- [ ] Prefer repository + live demo + video, although all three are not mandated.
- [ ] Setup instructions, configuration names and architecture included in application README.
- [ ] Dependencies, data sources and original contribution disclosed.
- [ ] Evidence/limitations accurately distinguish quotes, simulations and real transactions.
- [ ] No secrets or tester personal records in repo/video/logs.
- [ ] Demo works in a fresh session without the developer's credentials for comparison.
- [ ] All links and selected revision rechecked before submitting.
- [ ] Submitted ahead of close; confirmation/status actually recorded.

## Two-minute demo outline

1. **0:00–0:15:** “There are multiple tokenized versions of NVIDIA. Token counts alone don't tell you which quote gives more exposure.”
2. **0:15–0:45:** Select NVIDIA and a USDC amount; show both live quotes and real issuer/token names.
3. **0:45–1:10:** Explain normalized share-equivalent output and quote age. Change amount if useful; show whatever the live data says. Do not promise the winner will flip.
4. **1:10–1:40:** If verified, show the eligible tester's review/sign/receipt. Otherwise show the live comparison and explicitly say transaction execution remains unverified. A UI prototype or simulation must be labeled as such.
5. **1:40–2:00:** Show the original comparison logic and why it belongs on Solana; state the focused next step.

Use the September 15 observations as a labeled historical backup only. Do not splice a prior quote into a supposedly live trade or claim money was saved on a route that was never executed.

## Submission-copy starting point

Only use after the comparison app actually runs:

> StoxRoute compares tokenized representations of the same underlying equity on Solana. Users choose NVIDIA and a USDC amount; the app obtains current Jupiter quotes for NVDAx and NVDAon and normalizes the outputs using each mint's decimals and current Scaled UI multiplier. It explains the difference in share-equivalent exposure while keeping issuer identity, fees, freshness and unavailable routes visible. The original work is the verified instrument mapping, normalization and comparison logic, and the user flow above existing Solana liquidity. Execution status and demo limitations are documented in the linked project.

Add a confirmed execution statement only after M3 passes. Add no unsupported “realized savings” claim. The page links to Colosseum as a later opportunity; it does not establish automatic entry into another event.

