#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, token, Address, Env};

const ONE: i128 = 10_000_000; // one whole unit (7 decimals)

struct Setup<'a> {
    _env: Env, // kept alive so the token/contract clients stay valid

    admin: Address,
    treasury: Address,
    buyer: Address,
    sale_id: Address,
    sale: SaleContractClient<'a>,
    xlm: token::TokenClient<'a>,
    tres: token::TokenClient<'a>,
}

/// Deploys XLM + TRES Stellar Asset Contracts and the sale contract, funds the
/// buyer with XLM and the contract with TRES. `price` is XLM stroops per TRES.
fn setup(price: i128, buyer_xlm: i128, contract_tres: i128) -> Setup<'static> {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let treasury = Address::generate(&env);
    let buyer = Address::generate(&env);

    let xlm_issuer = Address::generate(&env);
    let xlm_sac = env.register_stellar_asset_contract_v2(xlm_issuer);
    let xlm = token::TokenClient::new(&env, &xlm_sac.address());
    token::StellarAssetClient::new(&env, &xlm_sac.address()).mint(&buyer, &buyer_xlm);

    let tres_issuer = Address::generate(&env);
    let tres_sac = env.register_stellar_asset_contract_v2(tres_issuer);
    let tres = token::TokenClient::new(&env, &tres_sac.address());

    let sale_id = env.register(
        SaleContract,
        (
            admin.clone(),
            tres_sac.address(),
            xlm_sac.address(),
            treasury.clone(),
            price,
        ),
    );
    let sale = SaleContractClient::new(&env, &sale_id);

    token::StellarAssetClient::new(&env, &tres_sac.address()).mint(&sale_id, &contract_tres);

    Setup { _env: env, admin, treasury, buyer, sale_id, sale, xlm, tres }
}

#[test]
fn buy_moves_xlm_and_tres() {
    // 1 TRES = 50 XLM, buyer has 1000 XLM, contract holds 100 TRES.
    let s = setup(50 * ONE, 1000 * ONE, 100 * ONE);

    let cost = s.sale.buy(&s.buyer, &(2 * ONE)); // buy 2 TRES => 100 XLM

    assert_eq!(cost, 100 * ONE);
    assert_eq!(s.tres.balance(&s.buyer), 2 * ONE);
    assert_eq!(s.tres.balance(&s.sale_id), 98 * ONE);
    assert_eq!(s.xlm.balance(&s.treasury), 100 * ONE);
    assert_eq!(s.xlm.balance(&s.buyer), 900 * ONE);
}

#[test]
fn quote_rounds_up() {
    // price 3 stroops per whole TRES; buying 1 base unit costs ceil(3/1e7) = 1.
    let s = setup(3, 1000 * ONE, 100 * ONE);
    assert_eq!(s.sale.quote(&1), 1);
    assert_eq!(s.sale.quote(&ONE), 3);
}

#[test]
fn available_reflects_inventory() {
    let s = setup(50 * ONE, 1000 * ONE, 100 * ONE);
    assert_eq!(s.sale.available(), 100 * ONE);
    s.sale.buy(&s.buyer, &(10 * ONE));
    assert_eq!(s.sale.available(), 90 * ONE);
}

#[test]
fn set_price_changes_quote() {
    let s = setup(50 * ONE, 1000 * ONE, 100 * ONE);
    s.sale.set_price(&(60 * ONE));
    assert_eq!(s.sale.price(), 60 * ONE);
    assert_eq!(s.sale.quote(&ONE), 60 * ONE);
}

#[test]
fn buy_rejects_non_positive_amount() {
    let s = setup(50 * ONE, 1000 * ONE, 100 * ONE);
    assert_eq!(s.sale.try_buy(&s.buyer, &0).err().unwrap().unwrap(), Error::InvalidAmount.into());
}

#[test]
fn buy_rejects_when_inventory_too_low() {
    let s = setup(50 * ONE, 10_000 * ONE, 1 * ONE); // only 1 TRES in contract
    assert_eq!(
        s.sale.try_buy(&s.buyer, &(2 * ONE)).err().unwrap().unwrap(),
        Error::InsufficientInventory.into(),
    );
}

#[test]
fn withdraw_returns_unsold_tres_to_admin() {
    let s = setup(50 * ONE, 1000 * ONE, 100 * ONE);
    s.sale.withdraw_tres(&s.admin, &(40 * ONE));
    assert_eq!(s.tres.balance(&s.admin), 40 * ONE);
    assert_eq!(s.sale.available(), 60 * ONE);
}

#[test]
#[should_panic]
fn constructor_rejects_non_positive_price() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let a = Address::generate(&env);
    let b = Address::generate(&env);
    let t = Address::generate(&env);
    // price = 0 -> constructor panics during registration
    env.register(SaleContract, (admin, a, b, t, 0i128));
}
