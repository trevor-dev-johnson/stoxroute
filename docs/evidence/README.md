# Evidence fixtures

These files preserve the September 15, 2026 spike. They are historical evidence and test inputs, never runtime quote or multiplier fallbacks.

| File | Provenance and use |
|---|---|
| [registry-snapshot.json](registry-snapshot.json) | Manual structured transcription of issuer and RPC findings; unknown fields remain null |
| [nvda-10000-observation.json](nvda-10000-observation.json) | Exact printed quote/fee excerpts, timestamps, multipliers and expected normalization; not a complete Jupiter response |
| [nvda-comparison-observations.csv](nvda-comparison-observations.csv) | Successful quote observations; missing early timestamps remain blank |

For the 10,000 pair, mint and multiplier metadata is attached to the quote excerpt from preceding user-provided checks. It is not claimed to have been part of Jupiter's response. Decimal amounts are strings. `platformFee.amount`, request ID, transaction, and other unprinted quote fields were not reconstructed.

The pack does not include Trevor's full raw RPC captures from `research/`; preserve those files locally when installing this handoff. Current owner/extension validation must use live data or those actual saved responses. Live integration tests must refresh and must not assert a particular winner.

Preserve originals in `research/` when present. Keep new private captures, credentials and personal tester records out of public fixtures.
