import { createPublicClient, fallback, http } from 'viem';
import { base, polygon, mainnet } from 'viem/chains';
import { Blockchain } from '@/enums/Blockchain';

const httpBatch = (url: string) => http(url, { batch: { batchSize: 1000, wait: 16 } });

export const PUBLIC_CLIENTS = {
  [Blockchain.Base]: createPublicClient({
    chain: base,
    batch: { multicall: true },
    transport: fallback([
      httpBatch('https://mainnet.base.org'),
      httpBatch('https://base.llamarpc.com'),
      httpBatch('https://base.publicnode.com'),
      httpBatch('https://base.drpc.org'),
    ]),
  }),
  [Blockchain.Polygon]: createPublicClient({
    chain: polygon,
    batch: { multicall: true },
    transport: fallback([
      httpBatch('https://polygon-rpc.com'),
      httpBatch('https://polygon.llamarpc.com'),
      httpBatch('https://polygon.publicnode.com'),
      httpBatch('https://polygon.drpc.org'),
    ]),
  }),
  [Blockchain.Ethereum]: createPublicClient({
    chain: mainnet,
    batch: { multicall: true },
    transport: fallback([
      httpBatch('https://eth.llamarpc.com'),
      httpBatch('https://ethereum.publicnode.com'),
      httpBatch('https://eth.drpc.org'),
      httpBatch('https://rpc.ankr.com/eth'),
    ]),
  }),
};
