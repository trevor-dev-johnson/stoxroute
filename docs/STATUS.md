# StoxRoute current status

Last updated: **2026-09-15 22:28 Eastern**, after the unblocked M3 implementation and local verification.

## Phase

**M0–M2 are complete locally. Unblocked M3 wallet, review, server-gate, transaction-validation, simulation, submission, and receipt infrastructure is implemented and tested.** Execution remains intentionally gated; no deployment, live taker order, wallet signature, submission, or confirmation has been verified.

Local user path: `C:\Users\Trevor\dev\stoxroute`. Product name: **StoxRoute**. Deadline: **2026-09-18 16:00 Eastern / 20:00 UTC**. Main track only.

## Completed evidence

- [x] xStocks registry paginated successfully (832 assets at the snapshot).
- [x] NVIDIA/Tesla/SPY issuer addresses found in official xStocks and Ondo sources, with matching underlying ISINs.
- [x] NVDAx and NVDAon initialized mints and nonzero supply observed; decimals 8 and 9 respectively.
- [x] Both NVIDIA Scaled UI multipliers retrieved and active values resolved for the spike.
- [x] Positive Jupiter quotes at 100, 1,000 and 10,000 USDC for both NVIDIA wrappers.
- [x] Final 10,000-USDC round closely timed with fee excerpts preserved.
- [x] Backpack candidates set aside after three zero-supply observations.

Findings are in [VERIFIED-FINDINGS.md](VERIFIED-FINDINGS.md); they are not runtime constants or completed application features.

## Implementation checklist

- [x] M0: actual repo baseline and working Next.js setup.
- [x] M1: live current-state normalization/quote API with meaningful tests.
- [x] M2: usable live comparison page and honest failure states.
- [x] M3 engineering: gated wallet review/sign/execute/receipt flow implemented locally.
- [ ] M3: fee semantics checked with taker-specific order and actual receipt.
- [ ] M3: eligible tester and successful mainnet transaction evidence.
- [ ] M4: stable deployment and demo video.
- [ ] M4: dependencies credited, submission prepared and submitted.

## Next task — requires Trevor

Identify an independently eligible tester, privately verify the issuer/platform access basis, and provide that tester's base58 wallet plus server-side Jupiter API key/reliable mainnet RPC for a smallest-meaningful-amount supervised run. Keep `EXECUTION_ENABLED=false` until those prerequisites are satisfied.

## Unknowns and blockers

| Item | Current truth |
|---|---|
| Git remote/branch/commit/working tree | Target has no `.git` directory; changes are an uncommitted filesystem handoff |
| Framework/dependency versions/commands | Node 24.13.1, npm 11.8.0, Next 16.3.5, React 19.2.8; commands in README/package.json |
| Deployment/domain | None verified; .com availability was reported only |
| Jupiter credentials | No key configured; walletless spike worked, but managed execution currently requires a server-side key |
| RPC setup | Public mainnet RPC worked for user; deployment provider unknown |
| Current full mint owners/extensions | Runtime validates both as Token-2022 mints with matching decimals, metadata, a single Scaled UI config, initialized/unpaused state, and shared-slot chain time |
| Execution eligibility | Independent eligible tester not identified |
| Transaction construction/simulation/signing/receipt | Infrastructure and fixture tests complete; no live taker order, wallet action, submission, or receipt verified |
| Hackathon registration/submission | Not verified |
| Optional Tesla/SPY | Discovery only; remaining checks listed in findings |

## Existing research to preserve

Trevor's local scripts saved `research/xstocks-all-assets.json`, `ondo-tokens.csv`, `nvda-normalization.json`, `nvda-normalization-summary.json`, quote JSONs, comparison CSVs and mint checks. Inspect their actual existence before relying on them. The first large quote attempt and retry may have overwritten similarly named captures; do not reconstruct a history that was not saved. This pack contains a clearly labeled snapshot under `docs/evidence/`.

## Session update template

Append a concise note and update phase/checklists/next task above:

```md
### YYYY-MM-DD HH:MM timezone — commit or working tree

- Implemented:
- Checks run and actual results:
- Live evidence (time/slot/signature when applicable):
- Blocked/unverified:
- Decisions changed:
- Exact next task:
```

## Handoff log

### 2026-09-15 — documentation handoff

- Created: current scope, architecture, execution and hackathon requirements, milestones, acceptance checks and public evidence fixtures.
- Evidence: supplied real PowerShell results; final 10,000-USDC round favored Ondo by about 5.562 bps of normalized output.
- Limitation: no app/source or executed trade verified. No guarantee that current winners or multipliers match snapshots.
- Next: implement the live NVIDIA comparison first.

### 2026-09-15 21:37 Eastern — working tree (no Git repository)

- Implemented: Next.js 16/TypeScript/Tailwind baseline; explicit NVIDIA registry; shared-slot Solana mint-state reader; exact decimal normalization; concurrent Jupiter Swap V2 quote rounds; bounded whole-pair 429 retry; stale/partial/error handling; responsive desktop/mobile comparison UI; execution-gated action; setup README.
- Checks run and actual results: `npm run typecheck` passed; `npm run lint` passed; `npm test` passed 22/22 tests; `npm run build` passed with `/` static and `/api/quotes` dynamic. Browser checks covered desktop, 390px mobile, presets, invalid `1e3`, live details, and gated execution copy.
- Live evidence: 2026-09-15 21:37 Eastern, confirmed mint slot `447399267`. For 1,000 USDC, NVDAx returned `4.70779625` share-equivalent and NVDAon `4.70714404`; xStocks led that round by about `1.386` bps. Both used `jupiterz`, reported 10 bps included, and were shown as gasless walletless quotes. This is quote evidence only, not execution evidence.
- Blocked/unverified: no Git repository, private deployment RPC/Jupiter key, deployment/domain, eligible tester, taker-specific order, simulation, signature, receipt, or hackathon registration/submission.
- Decisions changed: none; implementation applies D010–D014.
- Exact next task: implement M3 wallet connection, server-side access gate, fresh selected-order review, and signed intent envelope with execution still disabled by default.

### 2026-09-15 22:28 Eastern — working tree (no Git repository)

- Implemented: Wallet Standard/Wallet Adapter connection; walletless comparison preserved; supervised review states; server-off switch and optional wallet allowlist; same-origin signed wallet challenge; fresh taker order and fresh multiplier path; strict registry/provider intent matching; decoded versioned-transaction/lookup-table checks; pre-sign and pre-submit simulation; short-lived HMAC intent; unchanged-message and Ed25519 signature verification; duplicate submission coalescing; Jupiter managed execute adapter; confirmed-chain debit/credit receipts; disabled/tester-required UI.
- Checks run and actual results: `npm run typecheck` passed; `npm run lint` passed; `npm test` passed 37/37 across 7 files; `npm run build` passed with `/` static and all six API routes dynamic. A direct request to `/api/execution/challenge` returned HTTP 403 `execution_disabled`. In-browser checks covered the live 1,000-USDC comparison, route selection, disabled supervised-execution panel, empty Wallet Standard installation state, 390×844 responsive layout with no horizontal overflow, and an empty browser error/warning log.
- Live evidence: a walletless 1,000-USDC browser round completed at approximately 22:32 Eastern: NVDAx `4.70393469` and NVDAon `4.70192945` share-equivalent, with xStocks ahead by `4.265` bps; both returned `jupiterz` and 10 bps included. This is quote evidence only. No taker order was requested because the server gate remained disabled. No transaction was signed, submitted, or confirmed.
- Blocked/unverified: eligible independent tester/access basis, approved wallet, Jupiter key, reliable deployment RPC, live taker response/schema behavior, live simulation/RFQ signature behavior, wallet authorization, provider submission, confirmed receipt, deployment, and hackathon submission.
- Decisions changed: D015 records stateless fail-closed intent and confirmed-receipt behavior.
- Exact next task: Trevor identifies an independently eligible tester and supplies the approved wallet/credentials for a supervised smallest-meaningful-amount mainnet verification; do not enable execution before then.
