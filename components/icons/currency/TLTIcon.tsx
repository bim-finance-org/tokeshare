import React from 'react';
import Image from 'next/image';

interface TLTIconProps {
  size?: number;
  className?: string;
}

const TLTIcon = ({ className = '' }: TLTIconProps) => {
  return (
    <Image
      src="/images/currencies/tlt.webp"
      alt="TLT_001"
      width={26}
      height={26}
      className={` ${className} rounded-full`}
    />
  );
};

export default TLTIcon;
