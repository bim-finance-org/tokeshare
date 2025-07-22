import Image from 'next/image';
import React from 'react';

interface USDTIconProps {
  size?: number;
  className?: string;
}

const USDTIcon = ({ size = 24, className = '' }: USDTIconProps) => {
  return (
    <Image
      src="/images/currencies/usdtLogo.png"
      alt="USDT"
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  );
};

export default USDTIcon;
