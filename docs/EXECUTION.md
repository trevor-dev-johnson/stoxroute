# Execution milestone and remaining gate

Updated: 2026-09-15. **The review, validation, and simulation infrastructure is implemented and tested with local fixtures, but no live taker order, wallet signature, submission, or receipt has been verified in this project.** Walletless quote success is the live evidence we have.

## Eligibility

Trevor is in Indiana. The selected products are not a verified US acquisition path. xStocks' issuer documentation restricts US distribution; Ondo's eligibility rules include US persons, US-located orders and people acting for their account/benefit. A tester must independently qualify and transact for themselves, using their own wallet and funds. A VPN, checkbox or overseas friend buying for Trevor is not a solution. [xStocks terms overview](https://docs.xstocks.fi/docs/product-legal-overview), [Ondo eligibility](https://docs.ondo.finance/ondo-stocks/eligibility).

Engineering can proceed with live comparison and wallet UI. Start with execution off. Before enabling a supervised test, record the applicable issuer/platform basis and the tester's eligibility confirmation privately, without putting identity documents in Git. Being outside the US alone does not prove eligibility in every other country.

For the short demo, a server-side approved-wallet list and a signed challenge can restrict the execution endpoints to a verified tester. This is access control for the demonstration, not a compliance system or legal approval for public distribution. Keep public execution disabled until its distribution/access questions are resolved. Do not mark an environment flag or IP filter as “compliance complete.”

## Intended flow

1. The user selects an actual issuer/token and a USDC budget. Connect a wallet through Wallet Standard/Wallet Adapter; never ask for key material.
2. Enforce execution mode/access server-side. Refresh mint state and both quotes. If the preferred issuer/output changes, show a new review; do not silently switch the instrument.
3. Request a fresh order for the explicitly selected mint and the user's wallet. Check provider errors and a nonempty transaction before requesting a signature.
4. Show issuer, symbol, mint link, spend, expected output, minimum output if provided, fees, restrictions and expiry. Bind the server-produced order to this intent.
5. Decode the versioned transaction; resolve lookup tables as needed. Check expected payer/signers and the intended user token flows using supported router schemas/simulation. Do not accept a client-supplied arbitrary transaction or assume amount validation alone proves its instructions.
6. Use supported simulation/preflight where available. Record result and limitations. RFQ transactions may need a market-maker signature added later; an incomplete-signature simulation failure is not evidence of zero liquidity or a successful preflight.
7. Ask the wallet to sign the original transaction, preserving any existing signatures. Do not locally rewrite instructions or blockhashes on RFQ payloads. Do not autoapprove wallet prompts.
8. Submit through the documented Jupiter V2 execute flow, preserving request ID and provider expiry information. Do not replace the RFQ flow with an arbitrary RPC send.
9. Track submission to confirmation; if status is uncertain, reconcile the known request/signature before retrying. Never request a second purchase because a network response timed out.
10. Render the real receipt from confirmed provider/chain evidence. Show pending honestly, and retain the explorer link if confirmation is delayed.

Jupiter's managed flow pairs `/order` with `/execute`; RFQ execution can involve an additional market-maker signature. Block-height and RFQ expiry fields must be honored. [Official execution documentation](https://developers.jup.ag/docs/swap/order-and-execute).

## Stateless server binding

No database is required. Before signing, issue a short-lived authenticated envelope tying together the wallet, allowed issuer mint, input amount, order request ID, expiry, and hash of the transaction message. After signing, verify the envelope and unchanged message bytes before forwarding. Use a server-only random HMAC secret or an existing equivalent; never a hardcoded/default secret. Verify wallet authorization independently of a claimed `taker` string.

Do not use a process-local map as the sole source of order state on Vercel. Expired or altered envelopes fail closed. Duplicate attempts must reconcile provider state for the existing order; they must not create a fresh purchase implicitly. Keep request bodies bounded and same-origin where applicable. No generalized public RPC or arbitrary URL proxy.

## Gate checklist

- [ ] Specific independently eligible tester/access basis established.
- [x] Execution authorization implemented and tested server-side, including wallet proof.
- [ ] Fresh taker-specific order built for the intended issuer and budget.
- [ ] Fee/debit accounting and minimum output understood.
- [ ] Simulation/preflight result and RFQ limitations recorded.
- [ ] Tester explicitly reviews and signs a small suitable test amount.
- [ ] Submission resolves to a verified signature/status.
- [ ] Receipt confirms actual debit/credit; no invented realized savings.

Choose the smallest meaningful amount supported by the actual route; the 10,000 USDC comparison preset is not a proposed test purchase. If this gate cannot be completed before the deadline, submit an honest live-comparison demo and say execution is unverified. Continue other milestones rather than concealing the limitation.

The implemented path additionally requires exact same-origin mutation requests, an optional server allowlist, fresh mint state, exact Jupiter input/output/taker matching, decoded transaction signer/mint checks, preserved message bytes, a valid wallet signature, nonexpired block height/provider time, repeat simulation before submission, and returned-signature equality. These checks are necessary but are not a substitute for the first eligible live-wallet verification.
