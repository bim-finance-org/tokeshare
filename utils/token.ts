import { Blockchain } from '@/enums/Blockchain';
import { TOKENS, TokenInfo } from '@/config/token';
import { Address } from 'viem';
import { IconComponent } from '@/types/Common';
import { TokenType } from '@/enums/TokenType';

export function getTokenAddress(symbol: string, blockchain: Blockchain): Address | undefined {
  return TOKENS[symbol]?.addresses[blockchain] as Address | undefined;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export function getTokenBlockchains(symbol: string): Blockchain[] {
  const token = TOKENS[symbol];
  if (!token) return [];

  return Object.entries(token.addresses)
    .filter(([_, address]) => !!address && address !== ZERO_ADDRESS)
    .map(([blockchain, _]) => blockchain as Blockchain);
}

export function getBlockchainTokens(blockchain: Blockchain): TokenInfo[] {
  return Object.values(TOKENS).filter((token) => !!token.addresses[blockchain]);
}

export function getTokenDecimals(symbol: string): number | undefined {
  const token = TOKENS[symbol];
  return token?.decimals;
}

export function getTokensByTypeAndByBlockchain(blockchain: Blockchain, type: TokenType): TokenInfo[] {
  return Object.values(TOKENS).filter((token) => token.type === type && !!token.addresses[blockchain]);
}

export function getCryptoTokensAcrossChains(): [TokenInfo, Blockchain][] {
  const result: [TokenInfo, Blockchain][] = [];

  Object.values(TOKENS).forEach((token) => {
    if (token.type === TokenType.Crypto) {
      for (const [chain, address] of Object.entries(token.addresses)) {
        result.push([token, chain as Blockchain]);
      }
    }
  });

  return result;
}

/**
 * Returns the React component icon for a given token symbol.
 *
 * @param symbol - Token symbol (e.g. "USDC")
 * @returns Icon component or undefined
 */
export function getTokenIcon(symbol: string): IconComponent | undefined {
  return TOKENS[symbol]?.icon;
}
