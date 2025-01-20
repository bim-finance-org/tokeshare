import React, { ComponentPropsWithRef } from "react";

const ArrowIcon = ({ size = 48, className, ...props }: ComponentPropsWithRef<"svg"> & { size?: number }) => {
  return (
    <svg width={size} height={size} className={className} {...props} viewBox="0 0 47.4 41.08" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
      <g>
        <polygon fill="#DAE0EA" points="44.43,21.04 4.63,37.31 14.08,21.04 4.63,4.79" />
      </g>
    </svg>
  );
};

export default ArrowIcon;
