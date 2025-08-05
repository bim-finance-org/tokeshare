import { Blockchain } from '@/enums/Blockchain';

export const getChainIdFromBlockchain = (blockchain: Blockchain): number => {
  switch (blockchain) {
    case Blockchain.Polygon:
      return 137;
    case Blockchain.Base:
      return 8453;
    default:
      throw new Error('Unsupported blockchain');
  }
};
