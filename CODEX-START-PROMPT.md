You are implementing StoxRoute in this repository for Stocklana, due September 18, 2026 at 4:00 PM Eastern / 20:00 UTC.

Read AGENTS.md and its required docs. Treat this pack as current product intent and the actual repository as implementation truth. Inspect the working tree and preserve my existing code, configuration, and research. If the app has not been scaffolded, create the agreed Next.js/TypeScript app without deleting the existing files. Use npm if there is no existing lockfile.

Start building now. Complete milestones M0–M2 in docs/BUILD-PLAN.md: repository setup, the live NVIDIA comparison engine, and the usable comparison screen. Do not just produce another plan. The discovery spike already verified NVDAx and NVDAon mints, matching underlying ISINs, their decimals and Scaled UI multipliers, and successful Jupiter quotes. Use docs/VERIFIED-FINDINGS.md and the evidence fixtures; refresh live state instead of hardcoding snapshot values.

Use Jupiter Swap V2 walletless orders to compare equal USDC inputs across NVDAx and NVDAon. Normalize base units with current onchain multipliers and use precise arithmetic. Show issuer, actual token, estimated share-equivalent exposure, quote age, fee information, and unavailable/rate-limited states. Support 100, 1,000 and 10,000 USDC presets. Do not require a wallet just to compare. Do not call partial or stale results a winner, subtract an included fee twice, or invent dramatic savings.

Keep the scope to NVIDIA first, xStocks + Ondo, Next.js/TypeScript, Tailwind/shadcn where useful, Solana Wallet Adapter, Jupiter, and RPC. No database, custom smart contract, separate backend, charts, AI, portfolios, lending, token launch or Backpack integration. Tesla and SPY wait until the core is complete.

Run the meaningful checks in docs/ACCEPTANCE.md. Get the app running locally and inspect its main flow. Then continue the unblocked wallet and receipt engineering from M3, with transaction execution gated as documented. Do not sign or spend funds yourself. Record tester or access blockers without stalling the quote/UI work.

Update docs/STATUS.md after material work with changed files, commands and results, remaining blockers and the next task. Record changed decisions. Use complete PowerShell commands when you need me to act. At the end, tell me what runs, how to open it, what was verified and the next blocker. This is a build request; keep working through the agreed scope while useful work remains.

