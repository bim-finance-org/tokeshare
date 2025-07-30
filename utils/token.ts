import { Blockchain } from '@/enums/Blockchain';
import { TOKENS, TokenInfo } from '@/config/token';
import { Address } from 'viem';

export function getTokenAddress(symbol: string, blockchain: Blockchain): Address | undefined {
  return TOKENS[symbol]?.addresses[blockchain] as Address | undefined;
}

export function getTokenBlockchains(symbol: string): Blockchain[] {
  const token = TOKENS[symbol];
  if (!token) return [];

  // On filtre les blockchains où il y a une address définie
  return Object.entries(token.addresses)
    .filter(([_, address]) => !!address)
    .map(([blockchain, _]) => blockchain as Blockchain);
}

export function getBlockchainTokens(blockchain: Blockchain): TokenInfo[] {
  return Object.values(TOKENS).filter((token) => !!token.addresses[blockchain]);
}

export function getTokenDecimals(symbol: string): number | undefined {
  const token = TOKENS[symbol];
  return token?.decimals;
}
