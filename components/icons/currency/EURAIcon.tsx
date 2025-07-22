import React from 'react';
import Image from 'next/image';

interface EURAIconProps {
  size?: number;
  className?: string;
}

const EURAIcon = ({ size = 24, className = '' }: EURAIconProps) => {
  return (
    <Image
      src="/images/currencies/euraLogo.png"
      alt="EURA"
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  );
};

export default EURAIcon;
