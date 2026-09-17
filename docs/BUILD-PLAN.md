# Build plan

Updated: 2026-09-15. Implement in order. Record actual progress in [STATUS.md](STATUS.md); this file defines the sequence, not completed work.

## M0 — inspect and scaffold

1. Inspect instructions, source, working tree, lockfile and existing environment examples without printing secrets. Record what already runs.
2. If only research/docs exist, scaffold Next.js/TypeScript/Tailwind. A scaffold tool may refuse a nonempty directory: generate in a temporary sibling and deliberately merge necessary files, preserving research/docs and Git. Do not erase the directory to satisfy the tool.
3. Choose the existing package manager or npm; add only necessary dependencies and scripts for dev, typecheck, lint, test, build. Record exact commands.
4. Merge `.env.example` expectations and ignore real `.env*` files while retaining the example. Keep node_modules, build output and local private captures out of Git. Public sanitized fixture evidence is intentional.

Exit: app boots locally; commands documented; no unrelated files lost. Do not build a landing page before the quote pipeline.

## M1 — verified live comparison engine

1. Add explicit NVDAx/NVDAon registry entries using the official addresses.
2. Implement fresh mint/owner/decimals/supply/Scaled UI reading, shared-slot time, and scheduled multiplier handling.
3. Implement exact USDC input conversion and decimal normalization. Load the 10,000-USDC observation as a regression fixture.
4. Add Jupiter V2 walletless quote adapter with runtime response validation, deadlines, structured errors and rate-limit handling.
5. Implement one concurrent comparison round, freshness/skew policy, incomplete-round handling, precise output ranking and fee caveats.
6. Expose `/api/quotes`; return amounts as strings and clear per-candidate statuses. Do not trust client mints or client multipliers.
7. Run meaningful tests and one real quote pair. Document any real upstream failures separately from test failures.

Exit: a supported amount yields traceable current comparison JSON; stale/partial/invalid responses never generate a false winner. An API outage does not justify a silent fixture fallback.

## M2 — usable comparison screen

1. Build the single-page input, presets, two issuer cards/table, and normal loading/error/partial/stale states.
2. Show actual token/issuer, share-equivalent exposure, quote-based unit cost, difference, fee state and quote freshness.
3. Keep detailed raw amounts, mint, multiplier and router available in a compact details area. No requirement for a stock reference-price service.
4. Compare without a wallet. Disable execution clearly while its gate is unresolved.
5. Run browser checks on desktop and mobile, including preset changes, invalid input, 429 recovery and one-provider failure.

Exit: a person can explain which quote gives more NVIDIA exposure and see when there is insufficient evidence to decide.

## M3 — wallet and actual receipt

Follow [EXECUTION.md](EXECUTION.md). Implement wallet connection, server-side execution access, fresh selected order, intent binding, review, wallet signing, managed submission and confirmation. Continue UI/adapter/test work even while waiting for a tester. Requote if the instrument, amount or wallet changes.

Make fee accounting concrete with the real order/receipt. Record simulation limitations for the selected router. Test rejection, expiry, failure, tampering and delayed confirmation. Complete a small explicitly approved transaction only through an eligible independent tester's wallet.

Exit: verified end-to-end evidence, or an explicit remaining execution blocker. Do not fabricate the exit condition or leave all other work unfinished waiting on it.

## M4 — submission-ready delivery

1. Finish critical bug fixes and run typecheck/lint/domain tests/build plus the core browser flow.
2. Prepare Vercel deployment configuration and clear setup/run instructions; deploy when access and authorization are available. Configure StoxRoute domain only if owned/access is available.
3. Write an application README with capabilities, local setup, architecture, sources/dependency credits and current limitations. Do not publish personal tester records or API keys.
4. Record the approximately two-minute demonstration and verify judge-accessible links.
5. Prepare submission copy; check [HACKATHON.md](HACKATHON.md), register/submit through the actual form before deadline. Do not report a submission without confirmation.

Exit: stable, accessible artifact and an accurate submission. A video showing a limitation is better than one implying an unperformed transaction.

## Remaining schedule

These are internal targets, not additional hackathon rules. Adjust for real elapsed time while retaining milestone order.

| Date / Eastern time | Target |
|---|---|
| Sep 15 | M0–M2: live NVIDIA comparison on screen; identify tester/access blocker |
| Sep 16 | M3: wallet flow, fee checks, simulation and tester transaction where possible |
| Sep 17 | Critical fixes, deployment, demo recording, submission draft |
| Sep 18 by noon | Internal code freeze and link checks |
| Sep 18 by 3 PM | Internal submission target, one hour ahead of official close |
| Sep 18 at 4 PM | Official close; no assumption of an extension |

If short on time, cut Tesla/SPY, animations, extra screens and the amount slider first. Keep numeric correctness, clear incomplete/stale states, source evidence, and submission preparation. Do not spend another day investigating Backpack.

