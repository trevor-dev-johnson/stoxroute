# Verified findings — evidence, not a live cache

Recorded on **2026-09-15**. The HTTP/RPC calls below were run by Trevor in Windows PowerShell; he supplied the outputs in this conversation. This handoff checks and preserves those outputs. It does not claim a fresh rerun of those network calls from this workspace or access to his application source.

## Decision

Proceed with the **NVIDIA comparison MVP using xStocks + Ondo**. There is evidence for two real mint candidates, common underlying identity, normalization, and positive live pricing routes. Successful end-to-end execution is still unverified.

## Official registry mappings

The xStocks list was downloaded through `https://api.backed.fi/api/v2/public/assets?page=N`; pages 0–8 returned 832 assets in total. Filtering `underlyingSymbol` located our three targets. This pagination behavior was observed, not guessed.

Ondo's [official contract-address page](https://docs.ondo.finance/addresses) linked to its [token CSV](https://www.dropbox.com/scl/fi/qjfxyg748mx0dwi6up86d/EXTERNAL-Ondo-GM-Tokens-Ondo-GM-Tokens.csv?dl=1&rlkey=n3no1w78wrah3umsl0nr9s77i). Its `Solana Deployed Address` and `ISIN` fields matched these entries.

| Underlying | Issuer / symbol | Solana mint | Underlying ISIN |
|---|---|---|---|
| NVIDIA | xStocks / NVDAx | `Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh` | `US67066G1040` |
| NVIDIA | Ondo / NVDAon | `gEGtLTPNQ7jcg25zTetkbmF7teoDLcrfTnQfmn2ondo` | `US67066G1040` |
| Tesla | xStocks / TSLAx | `XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB` | `US88160R1014` |
| Tesla | Ondo / TSLAon | `KeGv7bsfR4MheC1CkmnAVceoApjrkvBhHYjWb67ondo` | `US88160R1014` |
| SPDR S&P 500 ETF | xStocks / SPYx | `XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W` | `US78462F1030` |
| SPDR S&P 500 ETF | Ondo / SPYon | `k18WJUULWheRkSpSquYGdNNmtuE2Vbw1hpuUi92ondo` | `US78462F1030` |

USDC input mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`, six base-unit decimals used in the successful quote requests. Matching ISINs establish the referenced security, not identical issuer/legal rights.

## Onchain checks

| Symbol | Initialized mint | Decimals | Raw supply observed | What remains |
|---|---|---:|---|---|
| NVDAx | Yes | 8 | `32127821045863` | Refresh before runtime use |
| NVDAon | Yes | 9 | `16673739661687` | Refresh full owner/extensions before runtime use |
| TSLAon | Yes | 9 | `408165388466` | Current multiplier, live pair quotes, full owner/extensions |
| SPYon | Yes | 9 | `1504400878992` | Current multiplier, live pair quotes, full owner/extensions |
| TSLAx | Not checked in supplied outputs | Unknown here | Unknown here | Full mint/normalization and quotes |
| SPYx | Not checked in supplied outputs | Unknown here | Unknown here | Full mint/normalization and quotes |

NVDAx's full initial RPC response identifies `spl-token-2022`, owner `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`, metadata matching NVDAx, and an unpaused mint at slot `447246947`. Ondo's printed summary omitted its program-owner field; do not claim that field was displayed. Read the user's original full JSON when available or check it live.

Supplies are historical snapshots, not proofs of current liquidity. A nonzero supply alone was never the pass condition for quoting.

## NVIDIA normalization snapshot

| Symbol | Decimals | Active multiplier reported | Scheduled multiplier timestamp |
|---|---:|---|---:|
| NVDAx | 8 | `1.001701196801074` | `1789000200` |
| NVDAon | 9 | `1.0017152487959897` | `1788998645` |

The earlier xStocks mint contained old `multiplier=1.0009180758490996` and `newMultiplier=1.001701196801074`. The effective timestamp had passed. Blindly reading only `multiplier` would therefore have used stale conversion data. Both reported active values equal their `newMultiplier` in the later normalized summary.

The spike selected these values with local UTC time. The application should use fresh chain state/time and the policy in [ARCHITECTURE.md](ARCHITECTURE.md). These constants must not become production defaults. Scaled UI semantics are documented by [Solana](https://solana.com/docs/tokens/extensions/scaled-ui-amount/integration-guide), [xStocks](https://docs.xstocks.fi/developers/multipliers), and [Ondo](https://docs.ondo.finance/ondo-stocks/token-and-quote-pricing).

## Successful pricing observations

Walletless requests to Jupiter `/swap/v2/order` used ExactIn USDC input. They did not build a transaction or supply a wallet.

| USDC | Symbol | Normalized share-equivalent exposure | Router | Timing |
|---:|---|---|---|---|
| 100 | NVDAx | `0.46992309398332777627148` | metis | Exact timestamp not supplied |
| 100 | NVDAon | `0.4697402647773220686679931` | jupiterz | Same script round; exact timestamp not supplied |
| 1,000 | NVDAx | `4.69871151769468853380284` | metis | Exact timestamp not supplied |
| 1,000 | NVDAon | `4.6976108152207882300954777` | jupiterz | Same script round; exact timestamp not supplied |
| 10,000 | NVDAx | `46.94170647900800170791148` | jupiterz | 2026-09-15 12:54:27 UTC |
| 10,000 | NVDAon | `46.96781514198899757346652` | jupiterz | 2026-09-15 12:54:27 UTC |

The completed 10,000-USDC pair started 44.0319 milliseconds apart and completed 152.0152 milliseconds apart, with one attempt each. Its exact strings and quote-field excerpts are in [nvda-10000-observation.json](evidence/nvda-10000-observation.json).

At that time, Ondo provided `0.02610866298099586555504` additional share-equivalents, approximately **5.562 basis points / 0.05562%** more exposure. The rough $5.56 equivalent quoted in discussion was illustrative, not an actual refund or realized saving.

Both 10,000 quotes reported: 10 bps fee in USDC, platformFee also 10 bps (not an extra 10), `gasless=true`, zero signature/priority/rent fee fields, `slippageBps=0`, and no error. `platformFee.amount` was not supplied in the printed excerpts. These observations do not establish every wallet's final debit or gas cost.

The first 10,000-USDC attempt got a 429 for Ondo. Its sibling quote was not compared against the later retry. A 429 is rate limiting, not proof of absent liquidity. The successful retry replaced that incomplete pair.

**Do not infer a pure size effect:** smaller quotes were captured earlier. These observations show winners at different moments and sizes; they do not isolate size from market movement. Differences were modest, and transaction costs can matter.

## Why Backpack was set aside

The `country=US` inventory had empty token arrays. Unfiltered metadata exposed three candidates, each with six decimals and deposit/withdraw disabled:

| Symbol | Mint | Supply observed |
|---|---|---:|
| NVIDIA | `NVDAVuiB7hwd3m5Wa1JuHNovPaPG6BH1QNztbKFxNjv` | 0 |
| Tesla | `TSLAqBbv4CNCnzWFeB7LmydAyEiNMJtve7DYKLpdK4S` | 0 |
| SPY | `SPYBo66VJPFjh1pXMb9Le53kDYWTK1zzYVDeVRWtsbi` | 0 |

They were not usable existing spot-token inventory for this demonstration at the snapshots. This is not a claim about Backpack's future product or every mint it operates. No required MVP path depends on it.

## Evidence still missing

- Application repository inspection and a running implementation.
- Taker-specific orders, verified wallet-cost accounting, simulation and signed/confirmed transaction.
- Eligible tester and deployment/submission links.
- Robust multi-user quote rate behavior and UI validation.
- Tesla/SPY full normalization and live comparisons, if those optional assets are added.

Do not restart known discovery solely because these final gates are open. Implement NVIDIA now, refresh its runtime facts, and collect missing execution evidence separately.

