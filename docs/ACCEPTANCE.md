# Acceptance and verification

These are project gates, not claims that tests already exist. Choose tests that can catch wrong financial results or unsafe transaction behavior. No need for exhaustive decorative UI tests.

## Comparison math

- USDC `100`, `1000`, `10000` convert exactly to `100000000`, `1000000000`, `10000000000` base units; fractional inputs obey six-decimal limits.
- 8- and 9-decimal outputs use the right scale; very large raw integers survive serialization without Number precision loss.
- Active multiplier switches at the exact effective timestamp (test before, equal, after); malformed/missing/nonpositive configuration does not silently become one.
- A deliberately synthetic fixture where raw token counts imply the wrong issuer winner confirms normalization happens before comparison. Clearly label this fixture synthetic.
- The observed 10,000-USDC fixture reproduces both expected share-equivalent values within `1e-20` and selects Ondo for that historical round. Never assert the same winner for current market requests.
- Rounding does not change ranking; exact ties and configured near-ties have the intended labels.
- Matching ticker text with a different ISIN or an unexpected mint is rejected.

## Quote state and fees

- Positive output, proper input/output mints, ExactIn input and fee fields are validated. HTTP 200 with a provider error does not pass.
- Detect missing fields, zero-valued error codes when present, malformed JSON, HTTP 429, timeouts, and documented no-route responses distinctly.
- One candidate can remain visible when the other fails, but there is no full-pair winner.
- A retry separated from its sibling by too much time cannot be compared; the complete pair must be refreshed.
- Stale, expired or superseded request results cannot enable signing or replace a newer screen state.
- Included quote fees are not subtracted twice. Two fee-rate fields are not added by default. Missing fee data stays unknown.
- Walletless zero gas/rent fields do not become an unconditional promise for a funded wallet.
- Compare request deduplication/cooldown limits normal UI traffic; no endless automatic retry loop.

## Execution

- Server-side execution gate is enforced even when the client UI is bypassed; a wallet string alone is not proof of authorization.
- Request ID, expiry, issuer mint, amount, wallet and transaction message are bound and validated; changed or expired intent is rejected.
- Wallet change, rejected signature, insufficient funds, failed simulation, provider failure and expired order have recoverable states.
- Do not silently switch from the reviewed issuer to the other one or reconstruct an RFQ transaction locally.
- Duplicate submission/timeouts reconcile the original request/signature instead of triggering a second purchase.
- The receipt uses confirmed actual debits/credits and links to the real transaction. A pricing estimate is never a success receipt.
- Record the actual small tester transaction, route, timestamp and non-sensitive verification evidence; keep personal eligibility records out of the public repo.

## Browser flow

On desktop and a narrow mobile viewport: open without a wallet, compare preset amounts, enter invalid input, inspect token details, simulate a partial/error response, refresh a stale comparison, connect/reject a wallet, and read the receipt state. Confirm keyboard focus and labels. Every displayed “live” number must come from a current successful provider response.

## Delivery checks

Record actual commands/results in STATUS. Run the repository's available typecheck, lint, relevant test suite and production build once the implementation materially changes. Fix real failures; do not repeatedly rerun broad checks without a remaining risk.

For release, run one complete UI smoke check against the deployed version and verify submission links. External API outages should be recorded accurately, not disguised as passing integration tests or treated as proof the product has no market.

