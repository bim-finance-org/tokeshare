import { Blockchain } from '@/enums/Blockchain';

export const getChainIdFromBlockchain = (blockchain: Blockchain): number => {
  switch (blockchain) {
    case Blockchain.Polygon:
      return 137;
    case Blockchain.Base:
      return 8453;
    case Blockchain.Ethereum:
      return 1;
    default:
      throw new Error('Unsupported blockchain');
  }
};
