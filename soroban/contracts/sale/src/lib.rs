#![no_std]

//! TRES sale contract.
//!
//! Sells a fixed-price token (TRES) for XLM. Both TRES and XLM are accessed
//! through their Stellar Asset Contracts (SAC), so this contract works with a
//! classic Stellar asset wrapped into Soroban and with the native XLM SAC.
//!
//! Flow: the contract is pre-funded with TRES. A buyer calls `buy`, which pulls
//! XLM from the buyer to the treasury and sends TRES from the contract to the
//! buyer. The price is fixed in XLM (no oracle) and is admin-updatable.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, token, Address, Env, TryFromVal, Val,
};

/// Both XLM and classic Stellar assets use 7 decimals, so one whole unit is
/// 10^7 base units ("stroops"). `price` is expressed as XLM stroops per one
/// whole TRES, and amounts are passed in TRES base units.
const SCALE: i128 = 10_000_000;

// Instance-storage TTL management (~5s ledgers). Each state-changing call bumps
// the contract instance so its config does not expire on a live network.
const DAY_IN_LEDGERS: u32 = 17_280;
const INSTANCE_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    TresSac,
    XlmSac,
    Treasury,
    Price,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    InvalidPrice = 1,
    InvalidAmount = 2,
    InsufficientInventory = 3,
    NotInitialized = 4,
}

#[contract]
pub struct SaleContract;

#[contractimpl]
impl SaleContract {
    /// Runs once at deploy. `price` is XLM stroops per one whole TRES.
    pub fn __constructor(
        env: Env,
        admin: Address,
        tres_sac: Address,
        xlm_sac: Address,
        treasury: Address,
        price: i128,
    ) {
        if price <= 0 {
            panic_with_error!(&env, Error::InvalidPrice);
        }
        let storage = env.storage().instance();
        storage.set(&DataKey::Admin, &admin);
        storage.set(&DataKey::TresSac, &tres_sac);
        storage.set(&DataKey::XlmSac, &xlm_sac);
        storage.set(&DataKey::Treasury, &treasury);
        storage.set(&DataKey::Price, &price);
        storage.extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
    }

    /// Buy `tres_amount` (TRES base units) paying XLM at the current price.
    /// Returns the XLM cost in stroops. The buyer authorizes both this call and
    /// the XLM transfer out of their account.
    pub fn buy(env: Env, buyer: Address, tres_amount: i128) -> i128 {
        buyer.require_auth();
        if tres_amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let price: i128 = load(&env, &DataKey::Price);
        let tres_sac: Address = load(&env, &DataKey::TresSac);
        let xlm_sac: Address = load(&env, &DataKey::XlmSac);
        let treasury: Address = load(&env, &DataKey::Treasury);

        let xlm_cost = cost(price, tres_amount);

        let tres = token::TokenClient::new(&env, &tres_sac);
        let xlm = token::TokenClient::new(&env, &xlm_sac);
        let contract = env.current_contract_address();

        if tres.balance(&contract) < tres_amount {
            panic_with_error!(&env, Error::InsufficientInventory);
        }

        // Buyer -> treasury (XLM): the SAC calls buyer.require_auth() internally,
        // covered by the buyer's signature on this invocation tree.
        xlm.transfer(&buyer, &treasury, &xlm_cost);
        // Contract -> buyer (TRES): a contract authorizes transfers of its own
        // balance automatically as the direct invoker.
        tres.transfer(&contract, &buyer, &tres_amount);

        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        xlm_cost
    }

    /// Admin: update the fixed XLM price (stroops per whole TRES).
    pub fn set_price(env: Env, price: i128) {
        Self::require_admin(&env);
        if price <= 0 {
            panic_with_error!(&env, Error::InvalidPrice);
        }
        let storage = env.storage().instance();
        storage.set(&DataKey::Price, &price);
        storage.extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
    }

    /// Admin: change where incoming XLM is sent.
    pub fn set_treasury(env: Env, treasury: Address) {
        Self::require_admin(&env);
        let storage = env.storage().instance();
        storage.set(&DataKey::Treasury, &treasury);
        storage.extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
    }

    /// Admin: recover unsold TRES from the contract.
    pub fn withdraw_tres(env: Env, to: Address, amount: i128) {
        Self::require_admin(&env);
        let tres_sac: Address = load(&env, &DataKey::TresSac);
        token::TokenClient::new(&env, &tres_sac).transfer(&env.current_contract_address(), &to, &amount);
    }

    // ---- views ----

    /// XLM cost (stroops) for `tres_amount` TRES base units at the current price.
    pub fn quote(env: Env, tres_amount: i128) -> i128 {
        let price: i128 = load(&env, &DataKey::Price);
        cost(price, tres_amount)
    }

    /// TRES still available for sale (contract balance, in base units).
    pub fn available(env: Env) -> i128 {
        let tres_sac: Address = load(&env, &DataKey::TresSac);
        token::TokenClient::new(&env, &tres_sac).balance(&env.current_contract_address())
    }

    pub fn price(env: Env) -> i128 {
        load(&env, &DataKey::Price)
    }

    pub fn admin(env: Env) -> Address {
        load(&env, &DataKey::Admin)
    }

    pub fn treasury(env: Env) -> Address {
        load(&env, &DataKey::Treasury)
    }

    fn require_admin(env: &Env) {
        let admin: Address = load(env, &DataKey::Admin);
        admin.require_auth();
    }
}

/// Ceil division so rounding never short-changes the seller.
/// `overflow-checks = true` (release profile) turns any overflow into a panic.
fn cost(price: i128, tres_amount: i128) -> i128 {
    (tres_amount * price + SCALE - 1) / SCALE
}

/// Read a required config value from instance storage. Every key is written by
/// the constructor, so a missing key means the contract was never initialized —
/// fail with a typed error instead of an opaque `unwrap` panic.
fn load<V: TryFromVal<Env, Val>>(env: &Env, key: &DataKey) -> V {
    env.storage()
        .instance()
        .get(key)
        .unwrap_or_else(|| panic_with_error!(env, Error::NotInitialized))
}

mod test;
