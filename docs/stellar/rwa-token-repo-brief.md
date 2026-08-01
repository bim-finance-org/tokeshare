# RWA Token Repo — Tokenization Brief (TRES + QUAD)

Hand this to the **other repository** (the one that creates the RWA tokens). It
must produce **one reusable SEP-41 RWA token contract** and use it to tokenize
**two assets on Stellar testnet**: TRES (re-issued to the standard) and QUAD.

The tokeshare app (front + sale contract) is a **separate repo** and only
consumes the deployed token addresses (pasted by hand into its config — no DB).

---

## 1. What to build

### 1a. One reusable token contract — `contracts/rwa_token/`
An OpenZeppelin `stellar-tokens` (v0.7.2, soroban-sdk 26) SEP-41 fungible token
composing the **plain extensions** (NO identity/KYC module):

- `FungibleToken` (base: transfer, approve, balance, allowance)
- `FungibleBurnable` (burn — SEP-41 mandatory)
- `FungibleCapped` (max supply)
- Allowlist + blocklist (admin-managed on-chain lists gating transfers)
- `Pausable` (halt all transfers)
- Freeze (full/partial address freeze)
- Roles via `stellar-access`: `admin` (allow/block/pause/freeze) + `minter` (mint)

Constructor: `(admin, minter, name, symbol, decimals, cap)`.
Public interface beyond SEP-41 base: `mint`, `burn`, `allow`, `block`,
`is_allowed`, `pause`, `unpause`, `freeze`, `unfreeze`, `admin`, `cap`.

> This is a **custom Soroban token** (its own contract id), NOT a classic-asset
> SAC. The tokeshare sale contract uses `token::TokenClient::new(env, addr)`,
> which works against a custom token id directly — no SAC wrapping for the RWA
> token. (USDC, the payment asset, stays a classic SAC on the tokeshare side.)

### 1b. Deploy/mint pipeline — `scripts/`
Deploy **one token instance per asset** from a params file:
- `deploy-token.sh <slug>`: build wasm, deploy instance (cap = shares × 10^decimals),
  mint the full cap to the distributor, allow(distributor)+allow(treasury), print a
  paste-ready snippet for tokeshare.
- `allowlist.sh <slug> <address>`: allow/block one address (used to allowlist the
  sale contract once tokeshare deploys it, and to allowlist test buyers).
- `lifecycle.sh <slug> pause|unpause|freeze|unfreeze <args>`: admin controls, to
  demo compliance.

---

## 2. The two assets to tokenize

Both use **7 decimals** (Stellar convention; matches the sale contract's
`SCALE = 10^7`). A "share" = one whole unit = `10^7` base units.
`cap = TOTAL_SHARES × 10^7`.

| Asset | Slug | Name | Symbol | Decimals | Total shares (cap) | Price/share* | Notes |
|---|---|---|---|---|---|---|---|
| **TRES v2** | `tres` | Angel Cœur Caribe | `TRES` | 7 | same as current TRES supply (unchanged) | (existing) | Real-estate; SEP-41 re-issue of the existing classic TRES. New contract = new address. |
| **QUAD** | `tfw001` | Tokeshare forwill001 | `TFW_001` | 7 | **100** | **50 USDC** | A quad (transport vehicle) tokenized into 100 shares. |

> *Price/share is **not** set in the token contract — it lives in the tokeshare
> sale contract. Listed here only so the tokeshare-side sale deploy uses 50 USDC
> for TFW_001. The token only needs name/symbol/decimals/cap.
>
> TRES: keep the existing token count — pull the current TRES total supply and use
> it as the cap (do not change the number of tokens).

`scripts/assets/tres.env` and `scripts/assets/tfw001.env` hold these params;
secrets (`ADMIN_SECRET`, `MINTER_SECRET`, `DISTRIBUTOR_SECRET`, `TREASURY_PUBLIC`)
come from the environment, never committed.

---

## 3. Cross-repo handshake (per asset)

Token lives here, sale lives in tokeshare — order matters:

1. **[here]** `deploy-token.sh <slug>` → token deployed, cap minted to
   distributor, distributor+treasury allowlisted. Note the **token contract id**.
2. **[tokeshare]** deploy the sale contract referencing that token id (+ USDC SAC
   + price). Note the **sale contract id**.
3. **[here]** `allowlist.sh <slug> <saleContractId>` → the sale can hold
   inventory; distributor transfers inventory shares to the sale contract.
4. **[tokeshare]** hardcode `{ tokenId, saleId, decimals, totalShares, metadata }`
   into its `STELLAR_ASSETS` config array.
5. **[here]** on testnet, `allowlist.sh <slug> <buyerAddress>` for each test
   investor — a non-allowlisted buyer's purchase panics (the compliance gate we
   want to demonstrate).

---

## 4. Tests (Rust, `contracts/rwa_token/src/test.rs`)

Cover: mint up to cap / reject beyond cap; allowlisted↔allowlisted transfer OK,
to/from non-allowlisted rejected, blocked address rejected; burn reduces
balance+supply; pause halts transfers then resumes; freeze blocks the frozen
portion; non-admin allow/block/pause rejected, non-minter mint rejected.

---

## 5. Deliverables (roadmap 1.1)

- Public GitHub repo (this one) with README + architecture + build/test/deploy docs.
- CI: `cargo test` + `stellar contract build`.
- `.gitignore` the `target/` build artifacts.
- ≥2 tokens (TRES, QUAD) deployed on testnet via the pipeline.

---

## 6. Ready-to-paste prompt for the other repo's agent

Paste everything below into a fresh Claude Code session **inside the other repo**.

```
You are working in a fresh/near-empty repository whose sole purpose is to create
compliant RWA tokens on the Stellar (Soroban) blockchain and deploy them to
testnet. A separate app ("tokeshare") holds the frontend and a fixed-price sale
contract; it only consumes the token addresses we produce here (pasted by hand,
no database).

GOAL
Build ONE reusable SEP-41 RWA token contract, then tokenize TWO assets on Stellar
testnet with it:
  - TRES  — real-estate "Angel Cœur Caribe"; symbol TRES; 7 decimals;
            cap = the EXISTING TRES total supply (keep the current token count,
            do not change it).
  - TFW_001 — "Tokeshare forwill001", a quad (transport vehicle); symbol TFW_001;
            7 decimals; TOTAL_SHARES = 100. (Price 50 USDC/share is set on the
            tokeshare sale side, not in the token.)

STACK
- Rust, no_std, soroban-sdk v26.
- OpenZeppelin Stellar contracts v0.7.2: crates `stellar-tokens`,
  `stellar-contract-utils`, `stellar-access`, `stellar-macros`.
- Stellar CLI for deployment (`stellar contract build/deploy/invoke`).

STEP 0 — SPIKE FIRST (do this before anything else)
Look up the EXACT v0.7.2 API (prefer Context7 / the OpenZeppelin stellar-contracts
GitHub) for composing a fungible token with: base FungibleToken, FungibleBurnable,
FungibleCapped, an allowlist AND blocklist, Pausable, and a freeze capability —
WITHOUT pulling the full rwa::RWAToken identity/compliance-dispatcher module (we do
NOT want KYC/identity registries). Confirm the real trait/macro names before
writing the contract; the exact composition syntax must come from the actual
library, not from guesses.

STEP 1 — TOKEN CONTRACT  (contracts/rwa_token/)
Implement the token composing the plain extensions above. Requirements:
- Constructor(admin, minter, name, symbol, decimals, cap).
- Roles (stellar-access): admin = allow/block/pause/unpause/freeze/unfreeze;
  minter = mint. Non-authorized calls must fail.
- Interface beyond SEP-41 base: mint, burn, allow(addr), block(addr),
  is_allowed(addr), pause, unpause, freeze(addr[,amount]), unfreeze(addr[,amount]),
  admin(), cap().
- Transfers to/from a non-allowlisted or blocked address must panic. Transfers
  while paused must panic. Minting beyond cap must panic.
- 7 decimals. A "share" = one whole unit = 10^7 base units. cap = shares * 10^7.
- Release profile: overflow-checks = true, panic = "abort", lto, opt-level = "z".

STEP 2 — TESTS  (contracts/rwa_token/src/test.rs, soroban-sdk testutils)
Cover: mint up to cap / reject beyond cap; allowlisted<->allowlisted transfer OK;
transfer to/from non-allowlisted rejected; blocked address rejected; burn reduces
balance and supply; pause halts transfers then unpause resumes; freeze blocks the
frozen portion; non-admin allow/block/pause rejected; non-minter mint rejected.
`cargo test` must pass.

STEP 3 — DEPLOY PIPELINE  (scripts/)
- scripts/assets/tres.env  -> ASSET_NAME="Angel Cœur Caribe", ASSET_SYMBOL=TRES,
  DECIMALS=7, TOTAL_SHARES=<existing TRES supply>.
- scripts/assets/tfw001.env -> ASSET_NAME="Tokeshare forwill001",
  ASSET_SYMBOL=TFW_001, DECIMALS=7, TOTAL_SHARES=100.
  Secrets (ADMIN_SECRET, MINTER_SECRET, DISTRIBUTOR_SECRET, TREASURY_PUBLIC) read
  from the environment, never committed.
- scripts/deploy-token.sh <slug>: build wasm, install/upload once, deploy an
  instance (cap = TOTAL_SHARES * 10^DECIMALS), mint the full cap to the
  distributor, allow(distributor) + allow(treasury), then print a paste-ready
  snippet: { slug, name, symbol, tokenId, decimals, totalShares } for tokeshare.
  Support DRY_RUN=1 and SKIP_CONFIRM=1.
- scripts/allowlist.sh <slug> <address> [block]: allow (or block) one address.
- scripts/lifecycle.sh <slug> pause|unpause|freeze|unfreeze <args>.

STEP 4 — TOKENIZE THE TWO ASSETS ON TESTNET
Run the pipeline for `tres` then `tfw001`. Report each token's contract id and the
paste-ready config snippet. (The matching sale contracts are deployed on the
tokeshare side; afterwards we'll call allowlist.sh <slug> <saleContractId> so each
sale can hold inventory, plus allowlist.sh for test buyers.)

STEP 5 — REPO POLISH
README (build / test / deploy / architecture), CI running `cargo test` +
`stellar contract build`, and `.gitignore` for target/. This repo is the public
GitHub deliverable.

PARAMETERS (already decided — only TRES supply is a lookup)
- TRES: TOTAL_SHARES = the existing TRES total supply (look it up; keep it
  unchanged). Name "Angel Cœur Caribe", symbol TRES, 7 decimals.
- TFW_001: name "Tokeshare forwill001", symbol TFW_001, 7 decimals,
  TOTAL_SHARES = 100. Sale price 50 USDC/share (tokeshare side).

CONSTRAINTS
- Write code and comments in English.
- Do NOT include any KYC/identity module — allowlist/blocklist are plain
  admin-managed lists; how an address qualifies is out of scope.
- Everything targets TESTNET for now; assets may be demo assets, but shape the
  params files like real assets so a mainnet redeploy is just a data change.
- Prefer Context7 for OpenZeppelin/Soroban API lookups.
Start with STEP 0 and confirm the exact v0.7.2 API before writing the contract.
```
