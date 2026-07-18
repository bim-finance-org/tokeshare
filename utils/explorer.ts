import { Blockchain } from '@/enums/Blockchain';

/** Block explorer base URL per chain. */
export const EXPLORERS: Record<Blockchain, string> = {
  [Blockchain.Polygon]: 'https://polygonscan.com',
  [Blockchain.Base]: 'https://basescan.org',
  [Blockchain.Ethereum]: 'https://etherscan.io',
};

export const explorerAddressUrl = (chain: Blockchain, address: string): string =>
  `${EXPLORERS[chain]}/address/${address}`;

export const explorerTxUrl = (chain: Blockchain, hash: string): string => `${EXPLORERS[chain]}/tx/${hash}`;
