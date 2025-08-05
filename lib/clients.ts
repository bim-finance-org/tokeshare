import { createPublicClient, http } from 'viem';
import { base, polygon } from 'viem/chains';
import { Blockchain } from '@/enums/Blockchain';

export const PUBLIC_CLIENTS = {
  [Blockchain.Base]: createPublicClient({
    chain: base,
    transport: http('https://base.llamarpc.com'),
  }),
  [Blockchain.Polygon]: createPublicClient({
    chain: polygon,
    transport: http('https://polygon-rpc.com'),
  }),
};
