import React from 'react';
import Image from 'next/image';

interface TSP500IconProps {
  size?: number;
  className?: string;
}

const TSP500Icon = ({ className = '' }: TSP500IconProps) => {
  return (
    <Image
      src="/images/image_TSP500.png"
      alt="TSP500"
      width={26}
      height={26}
      className={` ${className} rounded-full`}
    />
  );
};

export default TSP500Icon;
