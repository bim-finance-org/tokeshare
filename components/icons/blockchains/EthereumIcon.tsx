import React from 'react';
import Image from 'next/image';

interface EthereumIconProps {
  size?: number;
  className?: string;
}

const EthereumIcon = ({ size = 24, className = '' }: EthereumIconProps) => {
  return (
    <Image
      src="/images/blockchains/ethereum.png"
      alt="Ethereum"
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  );
};

export default EthereumIcon;
