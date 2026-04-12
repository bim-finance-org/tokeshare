import BOLDIcon from '@/components/icons/currency/BOLDIcon';
import CRVIcon from '@/components/icons/currency/CRVIcon';
import DAIIcon from '@/components/icons/currency/DAIIcon';
import EURCIcon from '@/components/icons/currency/EURCIcon';
import EURSIcon from '@/components/icons/currency/EURSIcon';
import TGGIcon from '@/components/icons/currency/TGGIcon';
import TMCIcon from '@/components/icons/currency/TMCIcon';
import TSP500Icon from '@/components/icons/currency/TSP500Icon';
import USDCIcon from '@/components/icons/currency/USDCIcon';
import USDSIcon from '@/components/icons/currency/USDSIcon';
import USDTIcon from '@/components/icons/currency/USDTIcon';
import { Blockchain } from '@/enums/Blockchain';
import { TokenType } from '@/enums/TokenType';
import { IconComponent } from '@/types/Common';

export type TokenInfo = {
  symbol: string;
  name: string;
  addresses: Partial<Record<Blockchain, string>>;
  decimals: number;
  type: TokenType;
  icon?: IconComponent;
  cmcId?: number;
  internalUrl?: string;
};

export const TOKENS: Record<string, TokenInfo> = {
  TGG: {
    symbol: 'TGG',
    name: 'Tokeshare Gold Gram',
    addresses: {
      Polygon: '0x3d4Df7BD7Ea3f305Ac3A4065019B96d382834B71',
      Ethereum: '0x0000000000000000000000000000000000000000', // TODO: replace with deployed address
    },
    decimals: 18,
    type: TokenType.Crypto,
    icon: TGGIcon,
    internalUrl: '/marketplace/commodities/Gold',
  },
  TMC: {
    symbol: 'TMC',
    name: 'Tokeshare MarketCap 20 Index',
    addresses: {
      Base: '0xf47C9E511d215E286d3Ca1B956e7C3DD6F6195D4',
    },
    decimals: 18,
    type: TokenType.Crypto,
    icon: TMCIcon,
    cmcId: 38442,
    internalUrl: '/marketplace/stock-etf/tmc',
  },
  TSP500: {
    symbol: 'TSP500',
    name: 'Tokeshare S&P500',
    addresses: {
      Base: '0x9476d702Dc72242A7cEfBf802da8F09ddb305e51', // TODO: replace with deployed address
    },
    decimals: 18,
    type: TokenType.Crypto,
    icon: TSP500Icon,
    internalUrl: '/marketplace/stock-etf/tsp500',
  },
  TFT_001: {
    symbol: 'TFT_001',
    name: 'Tokeshare French Tacos',
    addresses: {
      Base: '0xB48F4d5E455a6d67f26FE364a201F51FF71aaB26',
    },
    decimals: 18,
    type: TokenType.Crypto,
    internalUrl: '/marketplace/other/french-tacos',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    addresses: {
      Polygon: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      Base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
    decimals: 6,
    type: TokenType.Stablecoin,
    icon: USDCIcon,
    cmcId: 3408,
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    addresses: {
      Polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    },
    decimals: 6,
    type: TokenType.Stablecoin,
    icon: USDTIcon,
    cmcId: 825,
  },
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    addresses: {
      Polygon: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      Base: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    },
    decimals: 18,
    type: TokenType.Stablecoin,
    icon: DAIIcon,
    cmcId: 4943,
  },
  EURS: {
    symbol: 'EURS',
    name: 'Stasis Euro',
    addresses: {
      Polygon: '0xE111178A87A3BFf0c8d18DECBa5798827539Ae99',
    },
    decimals: 2,
    type: TokenType.Stablecoin,
    icon: EURSIcon,
    cmcId: 2989,
  },
  USDCE: {
    symbol: 'USDCE',
    name: 'USD Coin Bridged',
    addresses: {
      Polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    },
    decimals: 6,
    type: TokenType.Stablecoin,
    icon: USDCIcon,
    cmcId: 18852,
  },
  EURC: {
    symbol: 'EURC',
    name: 'Euro Coin',
    addresses: {
      Base: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
    },
    decimals: 6,
    type: TokenType.Stablecoin,
    icon: EURCIcon,
    cmcId: 20641,
  },
  CRVUSD: {
    symbol: 'CRVUSD',
    name: 'Curve USD',
    addresses: {
      Base: '0x417Ac0e078398C154EdFadD9Ef675d30Be60Af93',
    },
    decimals: 18,
    type: TokenType.Stablecoin,
    icon: CRVIcon,
    cmcId: 24927,
  },
  BOLD: {
    symbol: 'BOLD',
    name: 'Bold Stablecoin',
    addresses: {
      Base: '0x03569cc076654f82679c4ba2124d64774781b01d',
    },
    decimals: 18,
    type: TokenType.Stablecoin,
    icon: BOLDIcon,
  },
  USDS: {
    symbol: 'USDS',
    name: 'Usds',
    addresses: {
      Base: '0x820c137fa70c8691f0e44dc420a5e53c168921dc',
    },
    decimals: 18,
    type: TokenType.Stablecoin,
    icon: USDSIcon,
  },
};
