# StoxRoute — agent instructions

Build StoxRoute for Stocklana. Current deadline: **2026-09-18 16:00 America/New_York (20:00 UTC)**. Current handoff date: 2026-09-15. This is the remaining three-day sprint, not a new five-day window.

## Start every session

1. Inspect the repository, existing instructions, lockfile, and working tree. Preserve unrelated changes and the user's `research/` files.
2. Read [current status](docs/STATUS.md), [product and scope](docs/PROJECT.md), and [architecture](docs/ARCHITECTURE.md).
3. Read [verification findings](docs/VERIFIED-FINDINGS.md) on the first session or when changing registry/normalization code. Read [execution](docs/EXECUTION.md) before wallet work; [hackathon requirements](docs/HACKATHON.md) before submission work.
4. Implement the next incomplete milestone in [the build plan](docs/BUILD-PLAN.md). [Decisions](docs/DECISIONS.md) explain the scope. [Acceptance checks](docs/ACCEPTANCE.md) define completion.

Do the work, run relevant checks, and update `docs/STATUS.md`. Do not stop at a plan or ask Trevor to run commands you can run. When his environment or an account is needed, give a complete PowerShell-compatible block with the exact expected output. Do not send fragments followed by corrections.

## Product contract

- **NVIDIA first. NVDAx + NVDAon. USDC input. Jupiter Swap V2.** These candidates were verified with live walletless quotes; this is enough to start implementation.
- Core loop: choose company/amount → compare current tokenized representations → explain quoted exposure → eligible wallet confirms → receipt.
- Neither Backpack nor any other issuer is a required dependency. Backpack's three tested stock mints had zero supply. Do not reopen issuer discovery without new evidence of a blocker.
- Price comparison is not issuer-quality advice. Show the actual issuer and token before signing. Matching ISINs do not make the instruments legally identical or interchangeable.
- Compare share-equivalent exposure, not raw tokens. Apply each current onchain multiplier once, after dividing base units by `10^decimals`.
- Snapshot multipliers and quotes are test evidence only. Never serve them as live data or use them as runtime fallbacks.
- A positive quote is not a built, simulated, or completed transaction. Preserve that distinction in UI, docs, and demos.

## Build boundaries

- One Next.js/TypeScript app with Tailwind, wallet adapter, Jupiter, and Solana RPC. Use existing versions/lockfile; default to npm if no package manager exists. Add only necessary dependencies.
- No database, custom program, separate backend, user accounts, AI, stock recommendations, charts, portfolios, lending, DCA, wrapper migration, token launch, or bounty integration.
- Keep comparison functions pure. Use decimal-safe math and integer strings/BigInt for base units. Round only for display; reject invalid, stale, incomparable, or mismatched data.
- Refresh both candidates together. Keep per-route failures visible. A single route is “only available quote,” not “best versus both.” Never confuse a rate limit with absent liquidity.
- Keep provider credentials and execution authorization server-side. Wallets sign in the browser; never request seed phrases/private keys.
- Implement quote mode immediately. Execution remains disabled until its documented gates pass; continue unblocked engineering while tester/access issues are resolved. Do not invent eligibility or bypass issuer/platform restrictions.
- Preserve wallet signatures and router requirements. A returned `jupiterz` router is valid even though old endpoints are deprecated.
- Test financially meaningful edge cases, transaction boundaries, and API failure behavior. Do not inflate coverage with tests of decorative components.

## Session handoff

Update `docs/STATUS.md` with implemented files, exact commands and results, remaining blockers, and one next task. Add material changes to `docs/DECISIONS.md`. Never mark missing live evidence as passed. User instructions take precedence over this pack; reconcile new instructions into these docs.


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
