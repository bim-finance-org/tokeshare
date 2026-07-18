import { Blockchain } from '@/enums/Blockchain';
import { ADDRESSES, AGGREGATORS } from './addresses';

// All address values come from the single source of truth in `./addresses`.
// These grouped exports are kept for their existing call sites.
const POLY = ADDRESSES[Blockchain.Polygon];
const BASE = ADDRESSES[Blockchain.Base];
const ETH = ADDRESSES[Blockchain.Ethereum];

// Contrats sur Polygon Mainnet
export const CONTRACTS = {
  TGG: POLY.TGG,
  ZAP: POLY.ZAP,
  PAXG: POLY.PAXG,
  TFT_001: BASE.TFT_001, // TFT is a Base token (kept here for backward compat).
  MARKETPLACE: POLY.MARKETPLACE,
  BATCH_DISTRIBUTOR: POLY.BATCH_DISTRIBUTOR,
};

export const BASE_CONTRACTS = {
  TMC: BASE.TMC,
  ZAP_TMC: BASE.ZAP_TMC,
  CMC20: BASE.CMC20,
  TSP500: BASE.TSP500,
  ZAP_TSP500: BASE.ZAP_TSP500,
  DESPXA: BASE.DESPXA,
};

// Contrats sur Ethereum Mainnet
export const ETH_CONTRACTS = {
  TGG: ETH.TGG,
  ZAP: ETH.ZAP,
  PAXG: ETH.PAXG,
};

type TGGContracts = { TGG: string; ZAP: string; PAXG: string };

const TGG_CONTRACTS_BY_CHAIN: Record<string, TGGContracts> = {
  [Blockchain.Polygon]: { TGG: CONTRACTS.TGG, ZAP: CONTRACTS.ZAP, PAXG: CONTRACTS.PAXG },
  [Blockchain.Ethereum]: ETH_CONTRACTS,
};

export const getTGGContracts = (blockchain: Blockchain): TGGContracts => {
  return TGG_CONTRACTS_BY_CHAIN[blockchain] ?? TGG_CONTRACTS_BY_CHAIN[Blockchain.Polygon];
};

// Contrats silver (TSG) sur Ethereum Mainnet — déployés et vérifiés on-chain le 2026-07-18.
// XAGM (Matrixdock Silver) est le sous-jacent réel, l'équivalent du PAXG pour l'or :
// 1 XAGM = 1 once troy d'argent.
export const ETH_SILVER_CONTRACTS = {
  TSG: ETH.TSG,
  ZAP: ETH.ZAP_SILVER,
  XAGM: ETH.XAGM,
};

type TSGContracts = { TSG: string; ZAP: string; XAGM: string };

const TSG_CONTRACTS_BY_CHAIN: Record<string, TSGContracts> = {
  [Blockchain.Ethereum]: ETH_SILVER_CONTRACTS,
};

export const getTSGContracts = (blockchain: Blockchain): TSGContracts => {
  return TSG_CONTRACTS_BY_CHAIN[blockchain] ?? TSG_CONTRACTS_BY_CHAIN[Blockchain.Ethereum];
};

export const TRUSTED_AGGREGATORS = AGGREGATORS;
