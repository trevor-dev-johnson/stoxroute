# StoxRoute Codex starter pack

Prepared **2026-09-15** from Trevor's verified PowerShell results and the current official documentation. This is an implementation handoff, not a built application.

## Install

Extract the archive contents into `C:\Users\Trevor\dev\stoxroute`, so `AGENTS.md` is directly in that directory. Do not create another nested `stoxroute` directory.

This replaces the earlier StockRoute planning pack. If the old five Markdown files are unchanged, replace them with these versions. If you or Codex have edited them since, preserve the newer work and merge this handoff. Do not replace application source, `.git`, secrets, or original research files. This archive contains no `.env.local` and writes evidence only under `docs/evidence/`.

Open Codex in the repository root and paste [CODEX-START-PROMPT.md](CODEX-START-PROMPT.md). Later sessions can start with: “Read AGENTS.md and continue the Next task in docs/STATUS.md.” Codex discovers project instructions from `AGENTS.md`; the linked docs are deliberately separate and must be read when instructed. [Official OpenAI guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

## What is here

| File | Purpose |
|---|---|
| [AGENTS.md](AGENTS.md) | Short, persistent working instructions |
| [CODEX-START-PROMPT.md](CODEX-START-PROMPT.md) | Exact initial build request |
| [docs/PROJECT.md](docs/PROJECT.md) | MVP, user journey, UI and scope |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack, modules, math, freshness and fees |
| [docs/VERIFIED-FINDINGS.md](docs/VERIFIED-FINDINGS.md) | Proven facts, source addresses, limitations |
| [docs/BUILD-PLAN.md](docs/BUILD-PLAN.md) | Ordered milestones and sprint schedule |
| [docs/EXECUTION.md](docs/EXECUTION.md) | Wallet flow, eligibility and receipt requirements |
| [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md) | Meaningful tests and demo acceptance |
| [docs/HACKATHON.md](docs/HACKATHON.md) | Rules, submission checklist and demo outline |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Decisions and superseded assumptions |
| [docs/STATUS.md](docs/STATUS.md) | Live progress and exact next task |
| [docs/evidence/README.md](docs/evidence/README.md) | JSON/CSV fixtures and provenance |
| [.env.example](.env.example) | Server/client configuration placeholders |

## What Trevor needs to supply

- Access to the local repository. Its application source and Git state have not been inspected by this handoff.
- A Jupiter developer key for a reliable shared demo if available. Keyless calls worked, and also hit a 429; do not block local quote work waiting for a key. [Current rate limits](https://developers.jup.ag/docs/portal/rate-limits).
- An RPC endpoint for deployment; the public Solana mainnet RPC worked during the spike. Keep private RPC credentials on the server.
- An eligible independent tester for the execution demonstration, their own wallet and funds, and explicit agreement to the specific test. No transaction has yet been authorized or executed by this pack.
- Deployment/domain access when ready. The name is **StoxRoute**; availability of `stoxroute.com` was reported, but purchase and DNS setup are not verified.
- Stocklana registration/submission access. Registration has not been verified.

The first deliverable is a locally runnable **live NVIDIA comparison screen**, followed by the wallet flow. Do not repeat the entire discovery spike before beginning.

