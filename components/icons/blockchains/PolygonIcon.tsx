import React from 'react';
import Image from 'next/image';

interface PolygonIconProps {
  size?: number;
  className?: string;
}

const PolygonIcon = ({ size = 24, className = '' }: PolygonIconProps) => {
  return (
    <Image
      src="/images/blockchains/polygon.png"
      alt="Polygon"
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  );
};

export default PolygonIcon;
