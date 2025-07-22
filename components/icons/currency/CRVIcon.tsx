import React from 'react';
import Image from 'next/image';

interface CRVIconProps {
  size?: number;
  className?: string;
}

const CRVIcon = ({ size = 24, className = '' }: CRVIconProps) => {
  return (
    <Image
      src="/images/currencies/crvusd.png"
      alt="CRV"
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  );
};

export default CRVIcon;
