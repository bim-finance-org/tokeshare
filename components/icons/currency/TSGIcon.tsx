import React from 'react';
import Image from 'next/image';

interface TSGIconProps {
  size?: number;
  className?: string;
}

// TODO: replace with a dedicated TSG logo (currently reuses the silver commodity image).
const TSGIcon = ({ className = '' }: TSGIconProps) => {
  return (
    <Image src="/images/img-silver.webp" alt="TSG" width={17} height={17} className={` ${className} rounded-full`} />
  );
};

export default TSGIcon;
