import Image from 'next/image';
import React from 'react';

interface BOLDIconProps {
  size?: number;
  className?: string;
}

const BOLDIcon = ({ size = 24, className = '' }: BOLDIconProps) => {
  return (
    <Image
      src="/images/currencies/bold.webp"
      alt="BOLD"
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  );
};

export default BOLDIcon;
