#!/usr/bin/env bash
#
# Deploy the TRES sale on Stellar: issue the classic asset, wrap it as a SAC,
# deploy the Soroban sale contract, and fund it with sale inventory.
#
# The payment asset is configurable via PAY_ASSET ("native" for XLM, or
# "CODE:ISSUER" for a classic asset such as USDC). Config comes from environment
# variables (see .env.example). Secrets are read from env at runtime and never
# stored in the repo.
#
# Usage:
#   ./deploy.sh                # run for real (asks for confirmation)
#   DRY_RUN=1 ./deploy.sh      # print every command without executing
#   SKIP_CONFIRM=1 ./deploy.sh # run without the confirmation prompt
#
# ⚠️  On mainnet this spends real XLM and the deployed contract is immutable.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[[ -f "$SCRIPT_DIR/.env" ]] && { set -a; source "$SCRIPT_DIR/.env"; set +a; }

SCALE=10000000 # 7 decimals: 1 whole unit = 10^7 stroops

# ---- helpers ---------------------------------------------------------------

die() { echo "error: $*" >&2; exit 1; }

require_env() {
  for var in "$@"; do
    [[ -n "${!var:-}" ]] || die "missing required env var: $var"
  done
}

# Convert a decimal amount (up to 7 dp) to an exact integer stroop value.
to_stroops() {
  local amt="$1" int frac
  int="${amt%%.*}"
  if [[ "$amt" == *.* ]]; then frac="${amt#*.}"; else frac=""; fi
  frac="${frac}0000000"; frac="${frac:0:7}"
  echo "$((10#${int:-0}${frac}))"
}

# Run a command, echoing it first. Honors DRY_RUN.
run() {
  echo "+ $*" >&2
  [[ "${DRY_RUN:-0}" == "1" ]] && return 0
  "$@"
}

# Run a command and capture its stdout (used for the contract ids it prints).
capture() {
  echo "+ $*" >&2
  if [[ "${DRY_RUN:-0}" == "1" ]]; then echo "DRYRUN_PLACEHOLDER_ID"; return 0; fi
  "$@"
}

# ---- validation ------------------------------------------------------------

require_env \
  NETWORK_PASSPHRASE RPC_URL \
  ASSET_CODE ISSUER_PUBLIC ISSUER_SECRET \
  DISTRIBUTOR_PUBLIC DISTRIBUTOR_SECRET TREASURY_PUBLIC \
  ADMIN_PUBLIC ADMIN_SECRET \
  TOTAL_SUPPLY SALE_INVENTORY PRICE_PER_TRES

PAY_ASSET="${PAY_ASSET:-native}" # "native" (XLM) or "CODE:ISSUER" (e.g. USDC)
if [[ "$PAY_ASSET" == "native" ]]; then
  PAY_CODE="XLM"; PAY_ISSUER=""
else
  PAY_CODE="${PAY_ASSET%%:*}"; PAY_ISSUER="${PAY_ASSET#*:}"
  # Treasury must hold a trustline to receive a non-native payment asset.
  require_env TREASURY_SECRET
fi

WASM_PATH="${WASM_PATH:-$SCRIPT_DIR/../../soroban/target/wasm32v1-none/release/tres_sale.wasm}"
[[ "${DRY_RUN:-0}" == "1" || -f "$WASM_PATH" ]] || \
  die "wasm not found at $WASM_PATH — run 'cd soroban && stellar contract build' first"

command -v stellar >/dev/null || die "stellar-cli not found on PATH"

ASSET="${ASSET_CODE}:${ISSUER_PUBLIC}"
NET=(--rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE")

SUPPLY_STROOPS=$(to_stroops "$TOTAL_SUPPLY")
INVENTORY_STROOPS=$(to_stroops "$SALE_INVENTORY")
PRICE_STROOPS=$(to_stroops "$PRICE_PER_TRES") # payment-asset stroops per 1 whole TRES

# ---- summary + confirmation ------------------------------------------------

cat >&2 <<EOF

================ TRES sale deployment ================
  Network passphrase : $NETWORK_PASSPHRASE
  RPC URL            : $RPC_URL
  TRES asset         : $ASSET
  Payment asset      : $PAY_ASSET
  Issuer             : $ISSUER_PUBLIC
  Distributor        : $DISTRIBUTOR_PUBLIC
  Treasury (gets pay): $TREASURY_PUBLIC
  Admin (owns sale)  : $ADMIN_PUBLIC
  Total supply       : $TOTAL_SUPPLY TRES ($SUPPLY_STROOPS stroops)
  Sale inventory     : $SALE_INVENTORY TRES ($INVENTORY_STROOPS stroops)
  Price              : $PRICE_PER_TRES $PAY_CODE / TRES ($PRICE_STROOPS stroops)
  Wasm               : $WASM_PATH
  DRY_RUN            : ${DRY_RUN:-0}
======================================================

EOF

if [[ "${DRY_RUN:-0}" != "1" && "${SKIP_CONFIRM:-0}" != "1" ]]; then
  read -r -p "Proceed with deployment? Type 'yes' to continue: " answer
  [[ "$answer" == "yes" ]] || die "aborted by user"
fi

# ---- 1. distributor trustline to TRES --------------------------------------
echo ">> [1/7] Creating distributor trustline to $ASSET" >&2
run stellar tx new change-trust --source-account "$DISTRIBUTOR_SECRET" --line "$ASSET" "${NET[@]}"

# ---- 2. issue total supply: issuer -> distributor --------------------------
echo ">> [2/7] Issuing $TOTAL_SUPPLY $ASSET_CODE to the distributor" >&2
run stellar tx new payment \
  --source-account "$ISSUER_SECRET" \
  --destination "$DISTRIBUTOR_PUBLIC" \
  --asset "$ASSET" \
  --amount "$SUPPLY_STROOPS" \
  "${NET[@]}"

# ---- 3. treasury trustline to the payment asset (non-native only) ----------
if [[ "$PAY_ASSET" != "native" ]]; then
  echo ">> [3/7] Creating treasury trustline to $PAY_ASSET" >&2
  run stellar tx new change-trust --source-account "$TREASURY_SECRET" --line "$PAY_ASSET" "${NET[@]}"
else
  echo ">> [3/7] Payment asset is native XLM — no treasury trustline needed" >&2
fi

# ---- 4. wrap the TRES asset into a Soroban SAC -----------------------------
echo ">> [4/7] Deriving/deploying the TRES Stellar Asset Contract" >&2
TRES_SAC=$(capture stellar contract id asset --asset "$ASSET" "${NET[@]}")
run stellar contract asset deploy --asset "$ASSET" --source-account "$ADMIN_SECRET" "${NET[@]}" \
  || echo "   (TRES SAC may already be deployed — continuing)" >&2

# ---- 5. resolve (and deploy if needed) the payment asset SAC ---------------
echo ">> [5/7] Resolving the payment asset SAC id ($PAY_ASSET)" >&2
PAY_SAC=$(capture stellar contract id asset --asset "$PAY_ASSET" "${NET[@]}")
# The native XLM SAC is always present; a classic asset (e.g. USDC) needs its
# SAC deployed before the contract can move it. On mainnet USDC's SAC already
# exists, so this is a no-op caught below.
if [[ "$PAY_ASSET" != "native" ]]; then
  run stellar contract asset deploy --asset "$PAY_ASSET" --source-account "$ADMIN_SECRET" "${NET[@]}" \
    || echo "   (payment SAC may already be deployed — continuing)" >&2
fi

# ---- 6. deploy the sale contract with its constructor args -----------------
echo ">> [6/7] Deploying the sale contract" >&2
SALE_ID=$(capture stellar contract deploy --wasm "$WASM_PATH" --source-account "$ADMIN_SECRET" "${NET[@]}" -- \
  --admin "$ADMIN_PUBLIC" \
  --tres_sac "$TRES_SAC" \
  --pay_sac "$PAY_SAC" \
  --treasury "$TREASURY_PUBLIC" \
  --price "$PRICE_STROOPS")

# ---- 7. fund the sale contract with TRES inventory -------------------------
echo ">> [7/7] Funding the sale contract with $SALE_INVENTORY $ASSET_CODE" >&2
run stellar contract invoke --id "$TRES_SAC" --source-account "$DISTRIBUTOR_SECRET" "${NET[@]}" -- \
  transfer --from "$DISTRIBUTOR_PUBLIC" --to "$SALE_ID" --amount "$INVENTORY_STROOPS"

# ---- output ----------------------------------------------------------------
if [[ "${DRY_RUN:-0}" == "1" ]]; then
  echo "(dry-run: skipping .deploy-output.env)" >&2
  exit 0
fi

OUT="$SCRIPT_DIR/.deploy-output.env"
cat > "$OUT" <<EOF
# Generated by deploy.sh on $(date -u +%Y-%m-%dT%H:%M:%SZ)
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="$NETWORK_PASSPHRASE"
NEXT_PUBLIC_STELLAR_RPC_URL="$RPC_URL"
NEXT_PUBLIC_TRES_ASSET_CODE="$ASSET_CODE"
NEXT_PUBLIC_TRES_ASSET_ISSUER="$ISSUER_PUBLIC"
NEXT_PUBLIC_TRES_SAC_ID="$TRES_SAC"
NEXT_PUBLIC_PAY_ASSET_CODE="$PAY_CODE"
NEXT_PUBLIC_PAY_ASSET_ISSUER="$PAY_ISSUER"
NEXT_PUBLIC_PAY_SAC_ID="$PAY_SAC"
NEXT_PUBLIC_TRES_SALE_CONTRACT_ID="$SALE_ID"
EOF

cat >&2 <<EOF

✅ Deployment complete.
  TRES SAC          : $TRES_SAC
  Payment SAC ($PAY_CODE) : $PAY_SAC
  Sale contract     : $SALE_ID

Frontend env written to: $OUT
Copy those NEXT_PUBLIC_* values into .env.local.
EOF
