import { Blockchain } from '@/enums/Blockchain';

// Adresses des contrats sur Polygon Mainnet
export const CONTRACTS = {
  TGG: '0x3d4Df7BD7Ea3f305Ac3A4065019B96d382834B71',
  ZAP: '0xA5E2A2084426475F3E0D9cc6a261C2125bC43589',
  PAXG: '0x553d3D295e0f695B9228246232eDF400ed3560B5',
  TFT_001: '0xB48F4d5E455a6d67f26FE364a201F51FF71aaB26',
  MARKETPLACE: '0xe0F632423a6bf824d7E4463470549b73048C3f4e',
  BATCH_DISTRIBUTOR: '0x8c1eCBa803f7B83a2De69A99fb8D4a17776d1f2d',
};

export const BASE_CONTRACTS = {
  TMC: '0xf47C9E511d215E286d3Ca1B956e7C3DD6F6195D4',
  ZAP_TMC: '0x17b4CA0f1A49dB2c42596B3152c39C8aA7B7a0D9',
  CMC20: '0xa0A8481fc246Cd12f75227aBB96220fF5360fad3',
  TSP500: '0x9476d702Dc72242A7cEfBf802da8F09ddb305e51',
  ZAP_TSP500: '0xd7Ff11db71FBB64dC967efEB91eFa7A81287272D',
  DESPXA: '0x9c5C365e764829876243d0b289733B9D2b729685',
};

// Adresses des contrats sur Ethereum Mainnet
export const ETH_CONTRACTS = {
  TGG: '0x0764fF270AaCEdA56d0940327C50f8A199573A9b',
  ZAP: '0x1bF1a3b4D0662385B116de6f720d664B40721de5',
  PAXG: '0x45804880De22913dAFE09f4980848ECE6EcbAf78',
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
  TSG: '0x2544a889C03111853D8af56eb4bD010EDEE5E11f',
  ZAP: '0x608325b9e5a4b29f1d0d9238620cf3BbFD57AE10',
  XAGM: '0x123ffe0a3C62878dcbee2742227dc8990058d9E1',
};

type TSGContracts = { TSG: string; ZAP: string; XAGM: string };

const TSG_CONTRACTS_BY_CHAIN: Record<string, TSGContracts> = {
  [Blockchain.Ethereum]: ETH_SILVER_CONTRACTS,
};

export const getTSGContracts = (blockchain: Blockchain): TSGContracts => {
  return TSG_CONTRACTS_BY_CHAIN[blockchain] ?? TSG_CONTRACTS_BY_CHAIN[Blockchain.Ethereum];
};

export const BASE_TRUSTED_AGGREGATORS = {
  kyberSwap: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
};

export const TRUSTED_AGGREGATORS = {
  kyberSwap: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
};
