import React, { ComponentPropsWithRef } from "react";

const ArrowLongLineIcon = ({ size = 55, className, strokeColor = "#000000", fillColor = "#000000", ...props }: ComponentPropsWithRef<"svg"> & { size?: number; strokeColor?: string; fillColor?: string }) => {
  return (
    <svg
      width={size}
      height={size * (17.56 / 55.27)} // Maintient le ratio du SVG
      className={className}
      {...props}
      viewBox="0 0 55.27 17.56"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <g>
        <line x1="3.51" y1="8.88" x2="46.08" y2="8.93" stroke={strokeColor} strokeWidth="2" />
        <polygon fill={fillColor} points="53.14,8.94 43.18,12.99 45.55,8.93 43.19,4.86" />
      </g>
    </svg>
  );
};

export default ArrowLongLineIcon;
