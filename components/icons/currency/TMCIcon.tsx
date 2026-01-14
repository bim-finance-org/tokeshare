import React from 'react';
import Image from 'next/image';

interface TMCIconProps {
  size?: number;
  className?: string;
}

const TMCIcon = ({ className = '' }: TMCIconProps) => {
  return (
    <Image src="/images/currencies/tmc.png" alt="TMC" width={17} height={17} className={` ${className} rounded-full`} />
  );
};

export default TMCIcon;
