# StoxRoute current status

Last updated: **2026-09-18 17:38 Eastern**, after multi-asset scanner production deployment and public verification.

## Phase

**M0–M2 are complete. Unblocked M3 infrastructure remains server-disabled. The walletless three-asset Opportunity Board is deployed and publicly verified with selected-asset detail, streamed progress, ranked complete pairs, and isolated provider failures. M4 submission assets and the full local release suite are current.** Demo recording, hackathon form submission, and live tester execution are not complete at this timestamp.

Local user path: `C:\Users\Trevor\dev\stoxroute`. Product name: **StoxRoute**. Deadline: **2026-09-18 16:00 Eastern / 20:00 UTC**. Main track only.

## Completed evidence

- [x] xStocks registry paginated successfully (832 assets at the snapshot).
- [x] NVIDIA/Tesla/SPY issuer addresses found in official xStocks and Ondo sources, with matching underlying ISINs.
- [x] NVDAx and NVDAon initialized mints and nonzero supply observed; decimals 8 and 9 respectively.
- [x] Both NVIDIA Scaled UI multipliers retrieved and active values resolved for the spike.
- [x] Positive Jupiter quotes at 100, 1,000 and 10,000 USDC for both NVIDIA wrappers.
- [x] Final 10,000-USDC round closely timed with fee excerpts preserved.
- [x] Backpack candidates set aside after three zero-supply observations.
- [x] NVDA, TSLA, and SPY xStocks/Ondo mappings independently reverified from current issuer sources.
- [x] All six current Solana mints verified as initialized, unpaused Token-2022 mints with matching metadata, expected 8/9 decimals, and Scaled UI state at confirmed slot `448126418`.
- [x] Multi-asset streaming scan, progress, failure isolation, ranking, per-asset detail, and 30-second freshness implemented.

Findings are in [VERIFIED-FINDINGS.md](VERIFIED-FINDINGS.md); they are not runtime constants or completed application features.

## Implementation checklist

- [x] M0: actual repo baseline and working Next.js setup.
- [x] M1: live current-state normalization/quote API with meaningful tests.
- [x] M2: usable live comparison page and honest failure states.
- [x] M3 engineering: gated wallet review/sign/execute/receipt flow implemented locally.
- [ ] M3: fee semantics checked with taker-specific order and actual receipt.
- [ ] M3: eligible tester and successful mainnet transaction evidence.
- [ ] M4: stable deployment and demo video (deployment live; recording script complete; video pending).
- [ ] M4: dependencies credited, submission prepared and submitted.

## Next task — requires Trevor

Record/upload the scripted demo, then register and submit the repository, `https://stoxroute.vercel.app`, and video links before the conservative September 18 deadline.

## Unknowns and blockers

| Item | Current truth |
|---|---|
| Git remote/branch/commit/working tree | GitHub `trevor-dev-johnson/stoxroute`, `main`; scanner release `d8ca5cf` was independently confirmed on `origin/main` and deployed before this status-only release update |
| Framework/dependency versions/commands | Node 24.13.1, npm 11.8.0, Next 16.3.5, React 19.2.8; commands in README/package.json |
| Deployment/domain | Production deployment verified at `https://stoxroute.vercel.app`; execution config is persisted as `false` across Vercel environments |
| Jupiter credentials | No key configured; walletless spike worked, but managed execution currently requires a server-side key |
| RPC setup | Public mainnet RPC worked for user; deployment provider unknown |
| Current full mint owners/extensions | Runtime validates every pair as Token-2022 mints with matching decimals/metadata, one Scaled UI config, initialized/unpaused state, coherent pair slot, and plausible chain time |
| Execution eligibility | Independent eligible tester not identified |
| Transaction construction/simulation/signing/receipt | Infrastructure and fixture tests complete; no live taker order, wallet action, submission, or receipt verified |
| Hackathon registration/submission | Not verified |
| Tesla/SPY scanner support | Registry, mint-state validation, live quote scanning, ranking, and failure isolation are implemented; SPY can remain unavailable under keyless Jupiter throttling and is never ranked without a complete pair |

## Security review summary

- No high or critical production dependency advisories were reported. `npm audit --omit=dev` reports 12 moderate transitive advisories under the Solana wallet/web3 stack, with no compatible automatic fix for the current direct dependencies.
- API request bodies now require JSON and are limited using actual streamed bytes. The execution gate remains server-side and fail-closed.
- Production CSP, anti-framing, MIME-sniffing, referrer, permissions, opener, and HSTS headers are verified.
- Quote requests have process-local burst protection, and the browser aborts/discards obsolete overlapping comparisons. Distributed throttling still depends on Vercel/provider controls.
- No private keys, seed phrases, local environment files, or credentials were introduced or deployed.

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

### 2026-09-16 20:34 Eastern — `main` after M3 baseline `39b37f6`

- Published: initialized the existing empty `trevor-dev-johnson/stoxroute` GitHub repository, committed the complete M0–M3 project as `39b37f6`, and pushed `main`. The staged scan found only documented placeholders/test constants and two false-positive token-symbol fragments; no local environment or secret file was committed.
- Implemented for M4: three-step walletless walkthrough; clearer leading-quote label; share-equivalent, quote-implied dollar, and bps verdict; corrected stale/partial refresh action; improved loading/error copy; visible tokenized-asset restrictions; polished metadata; custom SVG favicon; reproducible/static social preview; production desktop/mobile screenshots; comprehensive README; concise submission copy and 60–90 second demo script.
- Checks run and actual results: `npm run typecheck` passed; `npm run lint` passed; `npm test` passed 37/37 across 7 files; `npm run build` passed with `/` and `/opengraph-image` static plus six dynamic API routes. Production browser checks at 1440×1000 and 390×844 covered empty, loading/live, invalid input, details, route selection, stale refresh, disabled purchasing, visible restrictions, no horizontal overflow, and an empty warning/error console.
- Live evidence: walletless production-browser quote rounds completed successfully; current winners varied by live response and were not hardcoded. Execution status remained disabled. No wallet was authorized and no transaction was prepared, signed, submitted, or confirmed.
- Official-page discrepancy: on September 16 the Stocklana header/countdown showed September 25, while its embedded rules still said September 18 at 4:00 PM Eastern. Continue using September 18 as the safe deadline.
- Blocked/unverified: judge-accessible deployment/domain, recorded/uploaded demo, hackathon registration/form confirmation, eligible independent tester, live taker order/simulation, wallet authorization, submission, and confirmed receipt.
- Decisions changed: D016 records the quote-implied value explanation without realized-savings language.
- Exact next task: Trevor deploys with the server gate off, records/uploads the prepared demo, and submits the links; the eligible-tester transaction remains a separate optional strengthening step.

### 2026-09-17 20:56 Eastern — production deployment review

- Implemented: streamed JSON media-type/size enforcement across all API mutations; quote burst limiting; obsolete comparison cancellation; production browser security headers; deployment and submission-link documentation.
- Checks run and actual results: `npm run typecheck` passed; `npm run lint` passed; `npm test` passed 40/40 across 8 files; `npm run build` passed. Production browser checks covered live walletless comparison, route details, route selection, 15-second stale state and refresh, disabled execution messaging, 390px layout geometry/no overflow, and browser warnings/errors. `npm audit --omit=dev` reported 0 high, 0 critical, and 12 moderate transitive advisories with no compatible fix.
- Deployment: Vercel production build passed and was aliased to `https://stoxroute.vercel.app`. Persisted `EXECUTION_ENABLED=false` for production/preview/development and the production canonical origin values.
- Live evidence: walletless 1,000-USDC rounds completed on local production during review; execution remained disabled. No transaction was prepared, signed, submitted, or confirmed.
- Blocked/unverified: dedicated deployment RPC/Jupiter credentials, eligible independent tester, live taker order/simulation, wallet authorization, confirmed receipt, recorded/uploaded demo, and hackathon form confirmation.
- Decisions changed: D017 records the public HTTP hardening boundary.
- Exact next task: Trevor records/uploads the prepared demo and submits the repository, deployment, and video links.

### 2026-09-17 22:02 Eastern — public Vercel verification

- Deployment access: disabled SSO protection for the `stoxroute` Vercel project only after Trevor's explicit approval. Git-fork protection remains enabled; no other project protection was changed.
- Deployment repair: changed only the StoxRoute framework preset from `other` to `nextjs` and redeployed, because the original setting built successfully but produced no routable Next.js output.
- Public verification: unauthenticated `https://stoxroute.vercel.app` returned the StoxRoute page with HTTP 200; `/api/quotes` returned HTTP 200 with two available live routes; `/api/execution/status` returned `enabled:false`, `configured:false`, and `testerRequired:true`; a direct challenge attempt returned HTTP 403.
- Header verification: CSP, `nosniff`, `DENY` anti-framing, strict referrer policy, restricted permissions policy, `same-origin-allow-popups`, and HSTS were present on the public response.
- Browser verification: the public 1,000-USDC walletless comparison completed with a fresh complete pair, estimate/restriction copy visible, purchasing labeled unavailable, and no browser warning/error logs.
- Transaction truth: no transaction was prepared, signed, submitted, or confirmed.
- Exact next task: Trevor records/uploads the prepared demo and submits the repository, deployment, and video links.

### 2026-09-18 12:08 Eastern — multi-asset scanner working tree

- Implemented: validated NVDA/TSLA/SPY issuer-pair registry; generic coherent mint-state and quote-round engine; explicit live/cached normalization provenance; implausible chain-time rejection; sequential bounded scanning with concurrent within-pair quotes; one whole-pair 429 retry; streamed progress; per-asset failure isolation; exact bps/dollar sorting; ranked Opportunity Board; selected-asset detail; 30-second display window; amount accessibility/tap-target improvements; registry/source documentation; updated metadata and submission script.
- Checks run and actual results: `npm run typecheck` passed; `npm run lint` passed; `npm test` passed 55/55 across 12 files; `npm run build` passed with `/api/opportunities` dynamic; `git diff --check` passed; secret-pattern scan found no match and no real environment/key file is tracked (`.env.example` is intentional). `npm audit --omit=dev` reports 12 moderate transitive Solana-stack advisories, 0 high/critical, and no available compatible fix.
- Browser evidence: 1440×1000 and exact 390×844 live scans showed three rows, correct ranking/near-tie labels, no horizontal overflow, 44px minimum preset targets, visible restrictions, and `Tester required / Execution unavailable`. Invalid amount semantics and board-row selection were exercised. Browser console output was empty.
- Live evidence: issuer registries and all six mints were refreshed on 2026-09-18. Walletless scans returned complete current NVDA and TSLA pairs. Repeated keyless Jupiter throttling left SPY visibly unavailable after the single bounded retry; it was not ranked and no fixture replaced it.
- Blocked/unverified: reliable shared-demo Jupiter/RPC credentials, live SPY completion under current keyless throttling, semantic transaction-flow audit items, eligible tester transaction, uploaded demo, and hackathon submission confirmation.
- Decisions changed: D018 records the bounded verified scanner, explicit failure isolation, and unchanged execution boundary.
- Transaction truth: execution stayed server-disabled. No taker order or transaction was prepared, signed, submitted, or confirmed.
- Exact next task: deploy the fully verified scanner with `EXECUTION_ENABLED=false`, verify the public endpoint, then record/upload and submit the updated demo.

### 2026-09-18 17:38 Eastern — public multi-asset release verification

- Deployment: independently refreshed GitHub and confirmed `main`, `origin/main`, and GitHub `refs/heads/main` at `d8ca5cfeb125e86b32da08f5436ca9379a713283`. Vercel initially still served the older `1dd7602` NVIDIA-only release. The clean `d8ca5cf` checkout was deployed to production as `dpl_HTabLon9hsmAYoNzJKnuAB68q4Xh`, reached `READY`, and was promoted to the existing `stoxroute.vercel.app` alias without changing project protection or execution settings.
- Checks run and actual results: `npm run typecheck` passed; `npm run lint` passed; `npm test -- --run` passed 55/55 across 12 files; `npm run build` passed; `npm audit --omit=dev --audit-level=high` reported 0 high/critical and the existing 12 moderate transitive Solana-stack advisories. The production environment was checked without printing secrets and retained `EXECUTION_ENABLED=false`.
- Public/API evidence: unauthenticated `/` returned HTTP 200 with the multi-asset scanner title and NVDA/TSLA/SPY; `/api/opportunities` returned HTTP 200 `application/x-ndjson` with `start`, three streamed asset events, and `complete`; complete NVDA/TSLA rows were ranked by descending bps while a keyless-provider SPY failure remained visible and unranked. `/api/execution/status` returned `enabled:false`, `configured:false`, `allowlistConfigured:false`, and `testerRequired:true`; a direct challenge request returned HTTP 403 before any order preparation.
- Browser/security evidence: the public UI exposed the walletless scanner, visible estimate/restriction copy, and disabled supervised execution. The live board completed with two ranked rows and one unavailable row; browser warning/error logs were empty. CSP, HSTS, `DENY` anti-framing, `nosniff`, strict referrer policy, restricted permissions policy, and `same-origin-allow-popups` were present. The browser-smoke helper now waits for the actual scan control and completion instead of assuming a fixed production load delay.
- Transaction truth: execution remained server-disabled. No taker order or transaction was prepared, signed, submitted, or confirmed.
- Blocked/unverified: a dependable authenticated Jupiter/RPC setup for every demo scan, eligible tester transaction evidence, uploaded demo, and hackathon submission confirmation.
- Decisions changed: none.
- Exact next task: Trevor records/uploads the prepared demo and completes the submission form with the repository and public deployment links.
