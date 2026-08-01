# RWA Token Repo — Creation Plan (separate repository)

This plan covers the **separate repository** that creates the RWA tokens: the
OpenZeppelin SEP-41 Soroban token contract **plus** the deploy/mint pipeline that
issues **one token per tokenized asset (bien)**.

Boundary with `tokeshare`:
- **This repo:** RWA token contract + per-asset deploy/mint pipeline + tests + docs.
  This is the **public GitHub repo** deliverable of roadmap 1.1.
- **tokeshare repo:** keeps the **sale contract** (`soroban/contracts/sale/`), the
  frontend, the wallets. It consumes the deployed token addresses **hardcoded in
  a config file** (no database).

---

## 1. Repository setup

- Cargo workspace, `soroban-sdk = "26"`, `no_std`, release profile tuned
  (`overflow-checks = true`, `panic = "abort"`, `lto`, `opt-level = "z"`) — same
  shape as the existing tokeshare `soroban/Cargo.toml`.
- Dependencies: `stellar-tokens` + `stellar-contract-utils` + `stellar-access`
  + `stellar-macros` (v0.7.2).
- Structure:
  ```
  contracts/rwa_token/         # the token contract
    src/lib.rs
    src/test.rs
  scripts/                     # deployment pipeline (bash + stellar CLI)
    deploy-token.sh            # deploy + mint one asset
    allowlist.sh               # allow/block an address
    lifecycle.sh               # pause / unpause / freeze helpers
    assets/                    # one params file per bien (name, symbol, cap…)
      angel-caribe.env
      villa-two.env
  README.md                    # build / test / deploy / architecture
  .github/workflows/ci.yml     # cargo test + stellar contract build
  ```
- **Do commit** `.gitignore` for `target/` (the tokeshare `soroban/target/` is
  currently checked in — do not repeat that here).

---

## 2. The RWA token contract (`contracts/rwa_token/`)

Compose the **plain fungible extensions** (no identity/KYC module). Per S1
(confirm exact v0.7.2 trait/macro API before finalizing):

- **Base:** `FungibleToken` (transfer, approve, balance, allowance) — SEP-41.
- **`FungibleBurnable`** — burn (SEP-41 mandatory).
- **`FungibleCapped`** — max supply = total shares of the bien.
- **Allowlist + blocklist** — admin-managed on-chain lists gating transfers.
  `allow(addr)` / `block(addr)`. **How an address qualifies is off-chain and out
  of scope** (no KYC in Tranche 1).
- **`Pausable`** (from `stellar-contract-utils`) — `pause` / `unpause` halts all
  transfers.
- **Freeze** — full and/or partial address freeze (per S1, via the freeze
  extension; do NOT pull the whole `rwa::RWAToken` module just for this).
- **Roles** via `stellar-access`: an `admin` (allow/block/pause/freeze) and a
  `minter` (mint up to cap).

Constructor args per asset:
`(admin, minter, name, symbol, decimals, cap)`.

Decimals: **7** to match the Stellar convention already used by the sale contract
(`SCALE = 10^7`). A "share" = one whole unit = `10^7` base units. `cap` is
expressed in base units (`total_shares * 10^7`).

Public interface (beyond SEP-41 base): `mint(to, amount)`, `burn(from, amount)`,
`allow(addr)`, `block(addr)`, `is_allowed(addr)`, `pause()`, `unpause()`,
`freeze(addr[, amount])`, `unfreeze(addr[, amount])`, `admin()`, `cap()`.

> Note: this is a **custom Soroban token contract** (its own contract ID), NOT a
> classic-asset SAC. The tokeshare sale contract already uses
> `token::TokenClient::new(env, addr)`, which works against a custom token
> contract ID directly — **no SAC wrapping needed** for the RWA token. Only USDC
> (the payment asset) stays a classic SAC.

---

## 3. Per-asset deploy/mint pipeline (`scripts/`)

Each bien = one params file in `scripts/assets/<slug>.env`:
```
ASSET_NAME="Angel Coeur Caribe"
ASSET_SYMBOL="ACC"
TOTAL_SHARES=100000          # cap in whole shares
# secrets come from env: ADMIN_SECRET, MINTER_SECRET, DISTRIBUTOR_SECRET
```

`deploy-token.sh <slug>` steps (testnet):
1. Build the wasm (`stellar contract build`), install/upload once, reuse hash.
2. Deploy a token instance with constructor args (cap = `TOTAL_SHARES * 10^7`).
3. `mint` the full cap to the **distributor** address.
4. `allow` the distributor + treasury (so they can hold/move inventory).
5. Print a **paste-ready config snippet** for tokeshare (see §5) and append to
   `scripts/.deploy-output.env`.

Two supporting scripts:
- `allowlist.sh <slug> <address>` — allow/block an address (used to allowlist the
  sale contract once tokeshare deploys it, and to allowlist test buyers on
  testnet).
- `lifecycle.sh <slug> pause|unpause|freeze|unfreeze <args>` — admin controls,
  for demoing compliance in the acceptance run.

Run the pipeline for **≥2 biens** (roadmap: "multiple tokenized assets created").

---

## 4. Cross-repo handshake (per bien)

Because the token is here and the sale contract is in tokeshare, the order matters:

1. **[this repo]** `deploy-token.sh <slug>` → token deployed, cap minted to
   distributor, distributor+treasury allowlisted. Note the **token contract ID**.
2. **[tokeshare]** deploy the sale contract referencing that token contract ID
   (+ USDC SAC + price). Note the **sale contract ID**.
3. **[this repo]** `allowlist.sh <slug> <saleContractId>` → the sale can hold
   inventory. Then distributor transfers inventory shares to the sale contract
   (or mint directly to the sale, whichever the pipeline prefers).
4. **[tokeshare]** hardcode `{ tokenId, saleId, decimals, cap, metadata }` in the
   config file (§5).
5. **[this repo]** on testnet, `allowlist.sh <slug> <buyerAddress>` for each test
   investor — the buy panics for non-allowlisted buyers, which is the compliance
   gate we want to demo.

---

## 5. Handoff to tokeshare — hardcoded config (no DB)

The pipeline emits a snippet the tokeshare repo pastes into a multi-asset config
(extending today's single-asset `config/stellar.ts` into an array):

```ts
// tokeshare: config/stellar-assets.ts  (hand-maintained, copied from deploy output)
export const STELLAR_ASSETS = [
  {
    slug: 'angel-caribe',
    name: 'Angel Cœur Caribe',
    symbol: 'ACC',
    tokenId: 'C...ACC_TOKEN_CONTRACT_ID',   // from this repo
    saleId: 'C...ACC_SALE_CONTRACT_ID',      // from tokeshare deploy
    decimals: 7,
    totalShares: 100_000,
    image: '/images/stellar/angel-caribe.jpeg',
  },
  // second bien…
] as const;
```

tokeshare then maps its per-asset routes/hooks over this array. Since balances of
a custom token are **not visible via Horizon trustlines**, the portfolio + balance
reads on the tokeshare side must query each `tokenId` contract directly.

---

## 6. Tests (roadmap: issuance, sales, transfers, compliance)

Rust unit tests in `contracts/rwa_token/src/test.rs`, using `soroban-sdk`
testutils:
- **Issuance:** mint up to cap; mint beyond cap rejects.
- **Transfers:** allowlisted↔allowlisted succeeds; to/from non-allowlisted
  rejects; blocked address rejects.
- **Burn:** reduces balance + supply; burn beyond balance rejects.
- **Pause:** transfers rejected while paused, resume after unpause.
- **Freeze:** frozen address (or frozen amount) cannot transfer that portion.
- **Roles:** non-admin allow/block/pause rejects; non-minter mint rejects.

(The buy→compliance end-to-end path is tested on the tokeshare side, where the
sale contract lives — a non-allowlisted buyer's `buy` must panic.)

---

## 7. Milestones

- **M1 — Spike S1:** minimal compiling token composing
  fungible+burnable+capped+allowlist/blocklist+pausable(+freeze) + a couple of
  tests. Locks the exact v0.7.2 API.
- **M2 — Full contract + tests:** all §2 interface + §6 suite green.
- **M3 — Pipeline:** `deploy-token.sh` + `allowlist.sh` + `lifecycle.sh`, one
  bien deployed to testnet end-to-end.
- **M4 — Multi-asset + handoff:** ≥2 biens deployed; config snippet handed to
  tokeshare; cross-repo handshake (§4) validated with a real testnet buy.
- **M5 — Public repo polish:** README + architecture doc + CI green.

## 8. Open questions / risks

- **S1 (exact OZ API):** the v0.7.2 trait/macro composition for allowlist+freeze
  needs hands-on confirmation; the freeze primitive may only ship inside the RWA
  module — if so, cherry-pick it without the identity/compliance dispatcher.
- **Decimals vs whole shares:** 7 decimals keeps parity with the sale contract's
  `SCALE`; if shares must be indivisible, consider `decimals = 0` and adjust the
  sale contract's pricing math accordingly (coordinate with tokeshare).
- **Distributor vs mint-to-sale:** decide whether inventory reaches the sale via
  distributor transfer or direct mint — affects who must be allowlisted first.
- **Testnet only:** all of Tranche 1 is testnet; biens can be fictitious. Keep
  the params files shaped like real assets so mainnet is a data+redeploy change.
