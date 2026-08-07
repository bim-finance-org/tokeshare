import BOLDIcon from '@/components/icons/currency/BOLDIcon';
import CRVIcon from '@/components/icons/currency/CRVIcon';
import DAIIcon from '@/components/icons/currency/DAIIcon';
import EURCIcon from '@/components/icons/currency/EURCIcon';
import EURSIcon from '@/components/icons/currency/EURSIcon';
import TFTIcon from '@/components/icons/currency/TFTIcon';
import TGGIcon from '@/components/icons/currency/TGGIcon';
import TMCIcon from '@/components/icons/currency/TMCIcon';
import TSGIcon from '@/components/icons/currency/TSGIcon';
import TSP500Icon from '@/components/icons/currency/TSP500Icon';
import USDCIcon from '@/components/icons/currency/USDCIcon';
import USDSIcon from '@/components/icons/currency/USDSIcon';
import USDTIcon from '@/components/icons/currency/USDTIcon';
import { ADDRESSES } from '@/contracts/addresses';
import { Blockchain } from '@/enums/Blockchain';
import { TokenType } from '@/enums/TokenType';
import { IconComponent } from '@/types/Common';

const POLY = ADDRESSES[Blockchain.Polygon];
const BASE = ADDRESSES[Blockchain.Base];
const ETH = ADDRESSES[Blockchain.Ethereum];

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
      Polygon: POLY.TGG,
      Ethereum: ETH.TGG,
    },
    decimals: 18,
    type: TokenType.Crypto,
    icon: TGGIcon,
    internalUrl: '/marketplace/commodities/Gold',
  },
  TSG: {
    symbol: 'TSG',
    name: 'Tokeshare Silver Gram',
    addresses: {
      Ethereum: ETH.TSG,
    },
    decimals: 18,
    type: TokenType.Crypto,
    icon: TSGIcon,
    internalUrl: '/marketplace/commodities/Silver',
  },
  TMC: {
    symbol: 'TMC',
    name: 'Tokeshare MarketCap 20 Index',
    addresses: {
      Base: BASE.TMC,
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
      Base: BASE.TSP500,
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
      Base: BASE.TFT_001,
    },
    decimals: 18,
    type: TokenType.Crypto,
    icon: TFTIcon,
    internalUrl: '/marketplace/other/french-tacos',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    addresses: {
      Polygon: POLY.USDC,
      Base: BASE.USDC,
      Ethereum: ETH.USDC,
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
      Polygon: POLY.USDT,
      Ethereum: ETH.USDT,
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
      Polygon: POLY.DAI,
      Base: BASE.DAI,
      Ethereum: ETH.DAI,
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
      Polygon: POLY.EURS,
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
      Polygon: POLY.USDCE,
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
      Base: BASE.EURC,
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
      Base: BASE.CRVUSD,
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
      Base: BASE.BOLD,
    },
    decimals: 18,
    type: TokenType.Stablecoin,
    icon: BOLDIcon,
  },
  USDS: {
    symbol: 'USDS',
    name: 'Usds',
    addresses: {
      Base: BASE.USDS,
    },
    decimals: 18,
    type: TokenType.Stablecoin,
    icon: USDSIcon,
  },
};
