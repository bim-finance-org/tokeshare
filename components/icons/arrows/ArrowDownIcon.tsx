import React, { ComponentPropsWithRef } from 'react';

const ArrowDownIcon = ({
  size = 30,
  className,
  strokeColor = '#D7D8E3',
  ...props
}: ComponentPropsWithRef<'svg'> & { size?: number; strokeColor?: string }) => {
  return (
    <svg
      width={size}
      height={size * (22.11 / 30.88)} // Maintient le ratio du SVG
      className={className}
      {...props}
      viewBox="0 0 30.88 22.11"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <polyline
        points="5.86,7.09 14.61,17.11 24.91,7.09"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeMiterlimit="10"
        fill="none"
      />
    </svg>
  );
};

export default ArrowDownIcon;
