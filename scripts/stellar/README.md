# Stellar deployment — TRES sale

Deploys the [`tres-sale`](../../soroban) contract end to end: issues the TRES
classic asset, wraps it as a Soroban SAC, deploys the sale contract, and funds
it with sale inventory.

> ⚠️ The example config targets **mainnet** — real funds, immutable contract.
> Review the contract and run `cd soroban && cargo test` before deploying.

## Prerequisites

1. **Tooling**: `stellar-cli` on PATH and the built wasm:
   ```bash
   cd soroban && stellar contract build
   ```
2. **Accounts**: an issuer, distributor, treasury and admin (you may reuse one
   account for several roles). Generate and inspect with:
   ```bash
   stellar keys generate issuer --network mainnet
   stellar keys address issuer        # public  G...
   stellar keys show issuer           # secret  S...
   ```
   **Fund every account with XLM** (fees + reserves; Soroban deploys cost a few
   XLM). Mainnet accounts are funded by sending XLM to their public key.

## Run

```bash
cp .env.example .env      # then fill in keys + amounts (.env is gitignored)

DRY_RUN=1 ./deploy.sh     # preview every command, executes nothing
./deploy.sh               # real run (asks for confirmation)
```

On success it writes the resulting contract ids to `.deploy-output.env` as
`NEXT_PUBLIC_*` variables — copy those into the app's `.env.local` for the
frontend integration.

## What it does (6 steps)

1. Distributor opens a trustline to `TRES:<issuer>`.
2. Issuer pays the total supply of TRES to the distributor.
3. Wrap TRES into a Soroban SAC (`contract asset deploy`).
4. Resolve the native XLM SAC id.
5. Deploy the sale contract with `__constructor(admin, tres_sac, xlm_sac, treasury, price)`.
6. Distributor transfers the sale inventory of TRES into the contract.

## Pricing

`PRICE_XLM_PER_TRES` is the fixed price in XLM for one whole TRES. It is
converted to stroops (×10⁷) for the contract. The admin can change it later:

```bash
stellar contract invoke --id <SALE_CONTRACT_ID> --source-account <ADMIN_SECRET> \
  --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" \
  -- set_price --price <new_price_in_stroops>
```
