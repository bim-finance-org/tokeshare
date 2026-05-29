# TRES sale — Soroban contract

Fixed-price sale of the **TRES** token for **XLM** on Stellar. The contract is
pre-funded with TRES; buyers pay XLM (sent to the treasury) and receive TRES.
Price is fixed in XLM and admin-updatable — no oracle.

- Contract: [`contracts/sale/src/lib.rs`](contracts/sale/src/lib.rs)
- Tests: [`contracts/sale/src/test.rs`](contracts/sale/src/test.rs)
- SDK: `soroban-sdk` 26

## Prerequisites (one-time)

```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32v1-none          # Wasm target for contracts

# Stellar CLI (deploy/invoke). Pick one:
cargo install --locked stellar-cli       # or: brew install stellar-cli
stellar --version
```

## Build & test

```bash
cd soroban
cargo test                 # run the unit tests (host target)
stellar contract build     # produce optimized Wasm in target/wasm32v1-none/release/
```

## Pricing units

Both XLM and classic assets use 7 decimals (1 unit = 10^7 "stroops").
`price` = **XLM stroops per one whole TRES**; amounts are in **TRES base units**.

Example: 1 TRES = 50 XLM → `price = 50 * 10_000_000 = 500_000_000`.

## Deployment to mainnet — order of operations

> ⚠️ Mainnet uses real funds and a deployed contract is immutable. Review the
> contract and run `cargo test` before deploying. These steps are scripted in
> the next deliverable (`scripts/stellar/`); outline below.

1. **Accounts/keys** (kept server-side only): `issuer`, `treasury`, `admin`.
2. **Issue the classic TRES asset**: distributor trustline to `TRES:<issuer>`,
   then issuer pays the total supply to the distributor.
3. **Wrap TRES into a SAC**: `stellar contract asset deploy --asset TRES:<issuer>`
   → gives the TRES SAC contract id. The native XLM SAC id is fixed per network.
4. **Deploy the sale contract** with constructor args
   `(admin, tres_sac, xlm_sac, treasury, price)`.
5. **Fund the contract**: transfer the sale inventory of TRES to the contract id.
6. **Wire the frontend**: put the contract id + TRES SAC id into the app config.

Buyers must hold a **trustline to TRES** before they can receive it (handled in
the frontend buy flow).
