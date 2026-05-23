import { createPublicClient, fallback, http } from 'viem';
import { base, polygon, mainnet } from 'viem/chains';
import { Blockchain } from '@/enums/Blockchain';

export const PUBLIC_CLIENTS = {
  [Blockchain.Base]: createPublicClient({
    chain: base,
    transport: fallback([
      http('https://mainnet.base.org'),
      http('https://base.llamarpc.com'),
      http('https://base.publicnode.com'),
      http('https://base.drpc.org'),
    ]),
  }),
  [Blockchain.Polygon]: createPublicClient({
    chain: polygon,
    transport: fallback([
      http('https://polygon-rpc.com'),
      http('https://polygon.llamarpc.com'),
      http('https://polygon.publicnode.com'),
      http('https://polygon.drpc.org'),
    ]),
  }),
  [Blockchain.Ethereum]: createPublicClient({
    chain: mainnet,
    transport: fallback([
      http('https://eth.llamarpc.com'),
      http('https://ethereum.publicnode.com'),
      http('https://eth.drpc.org'),
      http('https://rpc.ankr.com/eth'),
    ]),
  }),
};
