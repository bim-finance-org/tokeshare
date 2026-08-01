import React from 'react';
import PolygonIcon from '@/components/icons/blockchains/PolygonIcon';
import EthereumIcon from '@/components/icons/blockchains/EthereumIcon';
import BaseIcon from '@/components/icons/blockchains/BaseIcon';
import StellarIcon from '@/components/icons/blockchains/StellarIcon';

const ChainIcon = ({ chain, size = 18 }: { chain: string; size?: number }) => {
  if (chain === 'Polygon') return <PolygonIcon size={size} />;
  if (chain === 'Ethereum') return <EthereumIcon size={size} />;
  if (chain === 'Stellar') return <StellarIcon size={size} />;
  return <BaseIcon size={size} />;
};

export default ChainIcon;
