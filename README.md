# StoxRoute

StoxRoute compares current Jupiter quotes for NVDAx and NVDAon using equal USDC inputs, then normalizes raw token output with each mint's live Token-2022 Scaled UI multiplier. Quote mode does not require a wallet. A supervised Wallet Standard review/sign/receipt path is implemented, but transaction preparation is blocked server-side by default until the documented eligibility and verification gates pass.

## Run locally

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. The server uses `SOLANA_RPC_URL` for confirmed mint state and an optional `JUPITER_API_KEY` for Jupiter Swap V2. Do not expose either through client code unless the RPC endpoint is intentionally public.

Phantom and other installed Wallet Standard wallets are discovered by Wallet Adapter without bundling legacy wallet-specific adapters. Connecting a wallet is optional for comparison.

## Supervised execution configuration

Leave `EXECUTION_ENABLED=false` for the public comparison demo. To prepare a supervised tester environment, set all of the following on the server:

```dotenv
APP_ORIGIN=https://the-exact-deployment-origin.example
EXECUTION_ENABLED=true
EXECUTION_ALLOWED_WALLETS=Base58TesterWalletAddress
EXECUTION_INTENT_SECRET=a-random-server-only-secret-of-at-least-32-characters
JUPITER_API_KEY=server-side-jupiter-api-key
SOLANA_RPC_URL=https://a-reliable-mainnet-rpc.example
NEXT_PUBLIC_SOLANA_RPC_URL=https://an-intentionally-public-mainnet-rpc.example
```

`EXECUTION_ENABLED=true` is an operational switch, not eligibility approval. The allowlist may technically be empty, but the supervised test must configure the approved tester wallet. Never place `JUPITER_API_KEY` or `EXECUTION_INTENT_SECRET` in a `NEXT_PUBLIC_` variable.

The server issues a short-lived wallet challenge, refreshes current mint state, requests a new taker-specific Jupiter order, validates and simulates the decoded transaction, and binds the reviewed wallet/instrument/input/exposure/request/expiry/message hash into an authenticated envelope. The execute route verifies the unchanged signed message and wallet signature before forwarding the original payload. A confirmed receipt is calculated from onchain wallet token-balance deltas; quote estimates never become receipt values.

## Checks

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

## Current boundary

The application ranks only complete, current quote pairs by share-equivalent exposure. A partial round has no winner. Quote fees are displayed as provider facts and are not subtracted twice. This comparison is not issuer-quality advice and matching ISINs do not make the instruments legally identical. Historical files under `docs/evidence` and `research` are evidence and test fixtures, never runtime fallbacks.

Routing is supplied by Jupiter, instruments and registry data by xStocks and Ondo, and mint state by Solana JSON-RPC. See `docs/` for architecture, evidence provenance, execution gating, and hackathon constraints.

No mainnet transaction is signed or submitted by the automated test suite. Dependency audit currently reports 12 moderate transitive advisories in the Solana wallet/web3 stack with no compatible automatic fix; review upstream releases before deployment rather than forcing a breaking upgrade during the sprint.
