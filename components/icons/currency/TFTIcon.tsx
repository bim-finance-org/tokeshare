import React from 'react';
import Image from 'next/image';

interface TFTIconProps {
  size?: number;
  className?: string;
}

const TFTIcon = ({ className = '' }: TFTIconProps) => {
  return (
    <Image
      src="/images/currencies/tft.webp"
      alt="TFT_001"
      width={26}
      height={26}
      className={` ${className} rounded-full`}
    />
  );
};

export default TFTIcon;
