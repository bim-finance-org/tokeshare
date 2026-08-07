import React from 'react';
import Image from 'next/image';

interface TSGIconProps {
  size?: number;
  className?: string;
}

const TSGIcon = ({ className = '' }: TSGIconProps) => {
  return (
    <Image
      src="/images/currencies/tsg.webp"
      alt="TSG"
      width={17}
      height={17}
      className={` ${className} rounded-full`}
    />
  );
};

export default TSGIcon;
