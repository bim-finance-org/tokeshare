import React from "react";
import Image from "next/image";

interface BaseIconProps {
  size?: number;
  className?: string;
}

const BaseIcon = ({ size = 24, className = "" }: BaseIconProps) => {
  return (
    <Image
      src="/images/blockchains/base.png"
      alt="Base"
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  );
};

export default BaseIcon;
