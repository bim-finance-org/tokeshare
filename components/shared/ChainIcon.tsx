import React from 'react';
import PolygonIcon from '@/components/icons/blockchains/PolygonIcon';
import EthereumIcon from '@/components/icons/blockchains/EthereumIcon';
import BaseIcon from '@/components/icons/blockchains/BaseIcon';

const ChainIcon = ({ chain, size = 18 }: { chain: string; size?: number }) => {
  if (chain === 'Polygon') return <PolygonIcon size={size} />;
  if (chain === 'Ethereum') return <EthereumIcon size={size} />;
  return <BaseIcon size={size} />;
};

export default ChainIcon;
