import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

export const fallbackPublicClient = createPublicClient({
  chain: base,
  transport: http('https://base.llamarpc.com'),
});
