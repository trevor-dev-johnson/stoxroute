# Production asset registry verification

Expanded **2026-09-19** against issuer-controlled sources, confirmed Solana mainnet state, and positive Jupiter walletless quotes. Registry data is explicit application configuration; it is not inferred from ticker similarity and research snapshots are not runtime fallbacks.

## Supported pairs

| Underlying | xStocks symbol and Solana mint | Ondo symbol and Solana mint | Shared underlying ISIN |
|---|---|---|---|
| NVIDIA | `NVDAx` — `Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh` | `NVDAon` — `gEGtLTPNQ7jcg25zTetkbmF7teoDLcrfTnQfmn2ondo` | `US67066G1040` |
| Tesla | `TSLAx` — `XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB` | `TSLAon` — `KeGv7bsfR4MheC1CkmnAVceoApjrkvBhHYjWb67ondo` | `US88160R1014` |
| SPDR S&P 500 ETF | `SPYx` — `XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W` | `SPYon` — `k18WJUULWheRkSpSquYGdNNmtuE2Vbw1hpuUi92ondo` | `US78462F1030` |
| Apple | `AAPLx` — `XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp` | `AAPLon` — `123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo` | `US0378331005` |
| Microsoft | `MSFTx` — `XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX` | `MSFTon` — `FRmH6iRkMr33DLG6zVLR7EM4LojBFAuq6NtFzG6ondo` | `US5949181045` |
| Meta Platforms | `METAx` — `Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu` | `METAon` — `fDxs5y12E7x7jBwCKBXGqt71uJmCWsAQ3Srkte6ondo` | `US30303M1027` |
| Amazon | `AMZNx` — `Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg` | `AMZNon` — `14Tqdo8V1FhzKsE3W2pFsZCzYPQxxupXRcqw9jv6ondo` | `US0231351067` |
| Alphabet Class A | `GOOGLx` — `XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN` | `GOOGLon` — `bbahNA5vT9WJeYft8tALrH1LXWffjwqVoUbqYa1ondo` | `US02079K3059` |
| Invesco QQQ | `QQQx` — `Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ` | `QQQon` — `HrYNm6jTQ71LoFphjVKBTdAE4uja7WsmLG8VxB8ondo` | `US46090E1038` |

## Repeatable verification workflow

Run `node scripts/verify-asset-registry.mjs` from the repository root. Use `--tickers=AAPL,MSFT` to limit a run. The script:

1. Paginates the official [xStocks public asset registry](https://api.backed.fi/api/v2/public/assets).
2. Downloads the Ondo token CSV linked by [Ondo’s contract-address documentation](https://docs.ondo.finance/addresses).
3. Joins candidates on the issuer-declared **underlying ISIN**, then requires ticker consistency. A matching ticker alone is never accepted.
4. Requires exact official Solana mint addresses, Token-2022 ownership, initialized/nonzero supply, matching token metadata, the expected 8/9 decimals, an unpaused mint, exactly one Scaled UI configuration, and a plausible confirmed-slot block time.
5. Resolves the active multiplier at that chain time and requests deliberately paced `$100` USDC Jupiter quotes for both routes.
6. Reports a candidate as verified only when both quote intents match and both output amounts are positive. The script prints evidence JSON and does not modify the runtime registry.

The full 2026-09-19 run read 928 xStocks entries and 451 Ondo CSV rows. Official issuer APIs and schemas can change, so each future registry edit must rerun the workflow and review failures rather than treating this evidence as a live cache.

## 2026-09-19 added-asset evidence

Each row below records one coherent confirmed pair read followed by positive Jupiter ExactIn quotes for `100000000` USDC base units. Quote output is shown in token base units and is historical evidence only.

| Asset | Confirmed slot | xStocks decimals · active multiplier · quote output · router | Ondo decimals · active multiplier · quote output · router |
|---|---:|---|---|
| AAPL | `448505649` | `8` · `1.0032690125398187` · `29726994` · metis | `9` · `1.003376073740221` · `296451202` · jupiterz |
| MSFT | `448505663` | `8` · `1.0059033904787456` · `20059065` · metis | `9` · `1.0057308568927839` · `200479810` · jupiterz |
| META | `448505676` | `8` · `1.0028515433272898` · `14856992` · metis | `9` · `1.0022791066933001` · `148379539` · jupiterz |
| AMZN | `448505699` | `8` · `1` · `39231729` · metis | `9` · `1` · `391977880` · jupiterz |
| GOOGL | `448505711` | `8` · `1.0023772500603487` · `28403538` · metis | `9` · `1.0024603266374352` · `283409956` · jupiterz |
| QQQ | `448505723` | `8` · `1.0027250296551051` · `13806314` · metis | `9` · `1.0033528541550838` · `137706931` · jupiterz |

All twelve added mints had nonzero supply and matching metadata. QQQx had a future multiplier transition scheduled at the observed chain time; the verifier correctly recorded the then-active multiplier rather than the pending value.

## Excluded priority candidates

| Candidate | Exclusion evidence on 2026-09-19 |
|---|---|
| COIN | xStocks underlying ISIN `US19260Q1076` resolved to Ondo ticker `C`, not `COIN`; ticker-only equivalence was rejected. |
| PLTR | The official identity and both mints passed onchain checks, but the required Ondo Jupiter quote returned HTTP 400 because that route was unavailable outside market hours. |
| NFLX | The official identity and both mints passed onchain checks, but the xStocks route returned HTTP 400: “Quote not available from market maker.” |
| GLD | The official identity and both mints passed onchain checks, but the required Ondo Jupiter quote returned HTTP 400 because that route was unavailable outside market hours. |

These are point-in-time exclusions, not claims that the assets can never be supported. They require a fresh complete rerun before any later registry addition.

## Runtime behavior

Matching underlying ISIN establishes the referenced security for normalization. It does not make issuer terms, legal rights, transferability, eligibility, liquidity, or jurisdiction restrictions equivalent.

At runtime, every selected pair is read in one coherent `getMultipleAccounts` call and normalized with the confirmed slot’s block time. Registry owner, program, decimals, mint metadata, paused state, multiplier shape, and scheduled transition are validated again before a quote can be ranked.
