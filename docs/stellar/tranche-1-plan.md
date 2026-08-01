# Stellar Tranche 1 (MVP) — Implementation Plan

Branch: `feat/stellar-integration-tranche1`

This plan turns the current single-asset "POC Stellar" into the Tranche 1 MVP:
a compliant multi-asset RWA issuance system (Deliverable 1.1) and a dual-path
investor onboarding layer (Deliverable 1.2).

---

## 0. Starting point (what already exists)

- **Sale contract** `soroban/contracts/sale/` — fixed-price single-asset sale
  (`buy`, `set_price`, `set_treasury`, `withdraw_tres`, views). 8 Rust unit tests.
  Works against Stellar Asset Contracts (SAC) for both the sold token and the
  payment asset. **Not a token, no compliance.**
- **Frontend** `app/poc-stellar/page.tsx` — one hardcoded property, TRES↔USDC buy.
- **Wallets Kit** integrated in `context/StellarContext.tsx` (`allowAllModules()`
  → Freighter, Lobstr, xBull, Albedo…), unified connect modal, `signTransaction`.
- **Trustlines** in `lib/stellar.ts` (`hasTresTrustline`, `buildTrustlineXdr`),
  auto-created before buy in `hooks/useTresSale.ts`.
- **Config** `config/stellar.ts` — single `tres`/`pay` asset from env.
- **Deploy** `scripts/stellar/deploy.sh` (issues TRES as a *classic* asset, wraps
  as SAC, deploys sale contract).

---

## 1. Key architecture decisions

### D1 — The RWA token becomes a custom OpenZeppelin SEP-41 Soroban token
Today TRES is a **classic** Stellar asset. The roadmap mandates compliance
controls (allowlist/blocklist/cap/pause/freeze/burn) via OpenZeppelin. Those only
exist on a **custom SEP-41 Soroban token** (`stellar-tokens` v0.7.2), not on a
classic-asset SAC. So each RWA asset gets its own deployed OZ token contract.

Consequence: a custom Soroban token has **no classic trustline** (its balances
live in contract storage, invisible to Horizon trustline endpoints). This
actually simplifies the RWA side of onboarding (no `changeTrust` for the RWA
token). **Trustlines remain relevant only for the payment asset (USDC) and XLM
fees**, which stay classic SACs. `useStellarBalances` must read RWA balances via
the token contract, not Horizon.

> Scope note: the roadmap asks only for allowlist/blocklist/cap/pause/freeze/burn.
> The allowlist/blocklist is a **plain admin-managed on-chain list** (admin calls
> `allow(address)` / `block(address)`); how an address qualifies for the list —
> KYC, manual approval, open — is **out of scope for Tranche 1**. So we do NOT
> adopt OpenZeppelin's full `rwa::RWAToken` module (it bundles identity
> registries + a compliance dispatcher we don't need). Instead we compose the
> plain fungible extensions.
>
> Spike first (S1): confirm the exact `stellar-tokens` v0.7.2 trait/macro API for
> composing `FungibleToken` + burnable + capped + allowlist/blocklist + pausable
> (+ a freeze extension), without the RWA/identity machinery.

### D2 — Repo split + hardcoded config (no database)
The **RWA token contract + its deploy/mint pipeline live in a SEPARATE repo**
(see `rwa-token-repo-plan.md`) — that repo is the public GitHub deliverable of
1.1 and issues one token per bien. **tokeshare keeps the sale contract**
(`soroban/contracts/sale/`), the frontend and the wallets.

There is **no database**. Each tokenized asset = one token (other repo) + one
sale (tokeshare), and the deployed addresses are **hardcoded in a tokeshare
config file** — today's single-asset `config/stellar.ts` becomes a
`STELLAR_ASSETS` array of `{ slug, tokenId, saleId, decimals, totalShares,
metadata }`, pasted from the token repo's deploy output. The marketplace UI maps
its per-asset routes over that array.

### D3 — Privy coexists with Wallets Kit behind one signer interface
Both onboarding paths converge on the existing
`StellarContext.signTransaction(xdr) → signedXdr`. Wallets Kit signs client-side;
Privy signs **server-side** via `raw_sign` (ed25519, keys stay in custody). The
buy flow, quotes, trustline handling and portfolio are identical regardless of
path.

> Spike first (S2): validate Privy Stellar end-to-end on testnet — create a
> Stellar embedded wallet, hash a real transaction envelope correctly (SEP-53 /
> `hashX`), call `raw_sign`, attach the signature as a `DecoratedSignature`, and
> submit. The research on exact hashing/decorated-signature assembly needs
> hands-on confirmation before we build UI on top.

---

## 2. Deliverable 1.1 — Soroban RWA Infrastructure

### WS-A · RWA token contract + deploy pipeline → **SEPARATE REPO**
Fully specified in **`rwa-token-repo-plan.md`**. In short: an OpenZeppelin
SEP-41 token composing the plain fungible extensions (burnable + capped +
allowlist/blocklist + pausable + freeze, **no KYC/identity**), plus a per-asset
`deploy-token.sh` pipeline that issues ≥2 tokens on testnet. That repo is the
public GitHub deliverable + its own Rust test suite. **Not built in tokeshare.**

### WS-B · Sale contract upgrade (`soroban/contracts/sale/`)
- Keep the fixed-price model, but the sold token is now the RWA token; `buy`
  transfers through the RWA token so **compliance is enforced on purchase**
  (non-allowlisted buyer → transfer panics). Verify the sale contract's own
  address is allowlisted so it can hold/distribute inventory.
- Add lifecycle controls the roadmap mentions: `pause`/`unpause` on the sale,
  `refund` (buyer returns tokens, gets payment back within a window / admin
  approved), sale open/close window. Add investor accounting events for the
  dashboard.
- Acceptance: sales + refunds + lifecycle covered.

### WS-C · Per-asset sale deployment + config handoff (tokeshare side)
- Sale deploy script (`scripts/stellar/`): per asset, deploy a sale contract
  referencing the token contract ID (from the other repo) + USDC SAC + price;
  fund inventory. The token deploy/mint itself is the other repo's job.
- Cross-repo handshake (see `rwa-token-repo-plan.md` §4): token deployed there →
  sale deployed here → sale address allowlisted there → inventory funded.
- **No DB:** paste `{ slug, tokenId, saleId, decimals, totalShares, metadata }`
  for each bien into the tokeshare `STELLAR_ASSETS` config array.
- Acceptance: ≥2 assets buyable on testnet end-to-end (roadmap criteria 1 &amp; 2,
  jointly with the other repo).

### WS-D · Sale-contract tests (tokeshare side)
- Extend the sale Rust suite: buy through the RWA token, **non-allowlisted buyer
  rejected** (the end-to-end compliance gate), refund, pause/lifecycle. The
  token-level tests (issuance/transfers/burn/compliance) live in the other repo.
- Acceptance: sale + compliance-gate + refund covered (complements the token
  repo's suite for roadmap criterion 5).

---

## 3. Deliverable 1.2 — Investor Onboarding Layer

### WS-E · Multi-asset frontend (marketplace, not a single POC page)
- Replace the single hardcoded `app/poc-stellar/page.tsx` property with routes
  driven by the `STELLAR_ASSETS` config array: `app/stellar/[asset]/page.tsx`
  (no DB — the array is the source of truth, see D2).
- Refactor `config/stellar.ts`, `lib/stellar.ts`, `hooks/useTresSale.ts` from
  single `tres` to a per-asset parameterization (`useSaleInfo(assetId)`,
  `useBuy(assetId)`), reading RWA balances from the token contract (see D1).
- Acceptance: multi-asset purchase flow functional on testnet (criterion 2).

### WS-F · Wallets Kit hardening (crypto-native path)
- Already integrated; verify Lobstr, Freighter, xBull explicitly and document.
- Keep automated **payment-asset (USDC) trustline** management; drop RWA-token
  trustline logic (custom token has none). Ensure XLM funding hints for new
  accounts.
- Acceptance: Wallets Kit operational with the three named wallets + automated
  trustline management (criteria 1 &amp; 3).

### WS-G · Privy embedded wallets (mainstream path)
- Add `@privy-io/react-auth`; `PrivyProvider` nested with existing providers in
  `context/index.tsx`. Login methods: email + social (Google/Apple).
- Server: `app/api/stellar/wallet/route.ts` (create/get Stellar embedded wallet
  via Privy server API) and `app/api/stellar/sign/route.ts` (hash envelope →
  `raw_sign` → return signature). Guard with the app's auth.
- Implement a `PrivyStellarSigner` that satisfies the same `signTransaction`
  contract as Wallets Kit, so the buy flow is path-agnostic (D3).
- Acceptance: Privy embedded wallet creation via email/social; investments
  executed through **both** onboarding paths (criteria 5 &amp; 6).

### WS-H · Portfolio view
- `app/stellar/portfolio/page.tsx` — investor holdings across all registry
  assets: balances (from each RWA token contract), value at current sale price,
  links to Stellar Expert. Works for both Wallets Kit and Privy addresses.
- Acceptance: portfolio view displaying investor holdings (criterion 4).

---

## 4. Sequencing &amp; milestones

**Phase 0 — Spikes (de-risk the two unknowns)**
- S1: `stellar-tokens` v0.7.2 API — minimal compiling RWA token with
  cap+pause+allowlist+burn + tests.
- S2: Privy Stellar testnet round-trip — create wallet, sign a real envelope,
  submit. Confirm hashing/decorated-signature assembly.

**Phase 1 — Contracts (1.1)**: WS-A → WS-B → WS-C (tests alongside, WS-D).

**Phase 2 — Frontend multi-asset + crypto path (1.2)**: WS-E, WS-F.
Can start once WS-A/WS-B expose stable interfaces on testnet.

**Phase 3 — Privy + portfolio (1.2)**: WS-G, WS-H. WS-G depends on S2.

**Phase 4 — Hardening**: extract public repo + CI (WS-D), end-to-end testnet run
of both onboarding paths across ≥2 assets, remove `target/` from git.

Dependency notes: Phase 1 gates Phase 2/3 (frontend needs live testnet
contracts). WS-G/WS-H are independent of each other and can run in parallel once
WS-E lands. S1 and S2 are independent and run first, in parallel.

---

## 5. Acceptance-criteria traceability

| Roadmap criterion | Workstream |
|---|---|
| 1.1 · Multi-asset issuance on testnet | WS-A, WS-C |
| 1.1 · Multiple assets created &amp; managed | WS-C |
| 1.1 · SEP-41 RWA token w/ compliance + supply controls | WS-A |
| 1.1 · Public GitHub repo + docs | WS-D |
| 1.1 · Automated tests (issuance/sales/transfers/compliance) | WS-B, WS-D |
| 1.2 · Wallets Kit + Lobstr/Freighter/xBull | WS-F |
| 1.2 · Multi-asset purchase flow on testnet | WS-E |
| 1.2 · Automated trustline management | WS-F |
| 1.2 · Portfolio view | WS-H |
| 1.2 · Privy embedded wallet via email/social | WS-G |
| 1.2 · Investments via both onboarding paths | WS-G (+ WS-F) |

---

## 6. Risks &amp; open questions

- **Don't over-scope the token (S1):** OpenZeppelin's full `rwa::RWAToken` pulls
  in identity registries + a compliance dispatcher (up to 20 modules) that the
  roadmap does **not** ask for. Stay on the plain fungible extensions
  (allowlist/blocklist/pause/cap/burn/freeze). No KYC/identity in Tranche 1.
- **Privy Stellar maturity (S2):** Tier 2, launched late 2025; fewer references
  than EVM. Server-side signing + correct envelope hashing must be proven before
  building UI. Fallback: keep Privy for auth only + server-side HD key derivation.
- **Custom token ⇒ no Horizon visibility:** wallets/explorers may not show RWA
  balances natively; portfolio must read from the token contract. Confirm what
  Lobstr/Freighter display for Soroban token balances.
- **Testnet USDC:** ensure a testnet payment asset (test USDC issuer or native
  XLM) is wired in `config/stellar.ts` for end-to-end testnet demos.
- **Regulatory (existing memory):** buy/sell was removed on the EVM side for EU
  regulation; confirm the Stellar RWA sale is in-scope/authorized before
  mainnet. Testnet MVP is fine.
- **Mainnet vs testnet config:** `.env.local` currently points at mainnet
  contract IDs; Tranche 1 acceptance is on **testnet** — add a clean testnet env
  profile.
