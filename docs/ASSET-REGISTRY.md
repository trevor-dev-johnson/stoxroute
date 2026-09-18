# Production asset registry verification

Verified **2026-09-18** against issuer-controlled sources and Solana mainnet. Registry data is explicit application configuration; it is not inferred from ticker similarity and research snapshots are not used as runtime fallbacks.

| Underlying | xStocks | Ondo | Shared underlying ISIN |
|---|---|---|---|
| NVIDIA | `NVDAx` — `Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh` | `NVDAon` — `gEGtLTPNQ7jcg25zTetkbmF7teoDLcrfTnQfmn2ondo` | `US67066G1040` |
| Tesla | `TSLAx` — `XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB` | `TSLAon` — `KeGv7bsfR4MheC1CkmnAVceoApjrkvBhHYjWb67ondo` | `US88160R1014` |
| SPDR S&P 500 ETF | `SPYx` — `XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W` | `SPYon` — `k18WJUULWheRkSpSquYGdNNmtuE2Vbw1hpuUi92ondo` | `US78462F1030` |

## Issuer evidence

- xStocks entries were re-read by paginating the official [Backed public asset registry](https://api.backed.fi/api/v2/public/assets). Each entry supplied the Solana deployment and the underlying US ISIN shown above. The xStock token itself has a separate Swiss security ISIN; StoxRoute compares the issuer-declared underlying ISIN.
- Ondo entries were re-read from the official token CSV linked by [Ondo’s contract-address documentation](https://docs.ondo.finance/addresses). Its `Solana Deployed Address`, `Stock Ticker`, and `ISIN` fields supplied the mappings above.
- Matching underlying ISIN establishes the referenced security for normalization. It does not make issuer terms, legal rights, transferability, eligibility, liquidity, or jurisdiction restrictions equivalent.

## Live Solana verification

At confirmed slot `448126418`, one `getMultipleAccounts` read on 2026-09-18 found all six accounts owned by Token-2022, parsed as initialized mints, unpaused, and carrying matching token-metadata mint/symbol values plus exactly one Scaled UI configuration. The xStocks mints reported 8 decimals and the Ondo mints 9 decimals. The observed chain time was within the runtime’s permitted wall-clock skew. Supplies and multiplier values remain live state and are deliberately not copied into the production registry.

At runtime, each asset pair is read in one coherent `getMultipleAccounts` call and normalized with the confirmed slot’s block time. Registry owner, program, decimals, mint metadata, paused state, multiplier shape, and scheduled transition are validated before a quote can be ranked.
