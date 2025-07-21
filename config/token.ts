import { Blockchain } from "@/types/Blockchain";

export type TokenInfo = {
  symbol: string;
  name: string;
  addresses: Partial<Record<Blockchain, string>>;
  decimals: number;
};

export const TOKENS: Record<string, TokenInfo> = {
  TGG: {
    symbol: "TGG",
    name: "Tokeshare Gold Gram",
    addresses: {
      Polygon: "0x3d4Df7BD7Ea3f305Ac3A4065019B96d382834B71",
    },
    decimals: 18,
  },
  TFT_001: {
    symbol: "TFT_001",
    name: "Tokeshare French Tacos",
    addresses: {
      Base: "0x0764fF270AaCEdA56d0940327C50f8A199573A9b",
    },
    decimals: 18,
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    addresses: {
      Polygon: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      Base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    },
    decimals: 6,
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    addresses: {
      Polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    },
    decimals: 6,
  },
  DAI: {
    symbol: "DAI",
    name: "Dai Stablecoin",
    addresses: {
      Polygon: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
      Base: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    },
    decimals: 18,
  },
  EURS: {
    symbol: "EURS",
    name: "Stasis Euro",
    addresses: {
      Polygon: "0xE111178A87A3BFf0c8d18DECBa5798827539Ae99",
    },
    decimals: 2,
  },
  USDCE: {
    symbol: "USDCE",
    name: "USD Coin Bridged",
    addresses: {
      Polygon: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    },
    decimals: 6,
  },
  EURC: {
    symbol: "EURC",
    name: "Euro Coin",
    addresses: {
      Base: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
    },
    decimals: 6,
  },
};
