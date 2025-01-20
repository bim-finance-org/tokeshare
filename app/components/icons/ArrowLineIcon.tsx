import React, { ComponentPropsWithRef } from "react";

const ArrowLineIcon = ({ size = 48, className, strokeColor = "#181823", fillColor = "#181823", ...props }: ComponentPropsWithRef<"svg"> & { size?: number; strokeColor?: string; fillColor?: string }) => {
  return (
    <svg
      width={size}
      height={size * (25.28 / 47.86)} // Maintient le ratio du SVG
      className={className}
      {...props}
      viewBox="0 0 47.86 25.28"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <g>
        <line x1="6.34" y1="13.34" x2="29.56" y2="13.34" stroke={strokeColor} strokeWidth="2" />
        <polygon fill={fillColor} points="43.68,13.34 23.78,21.47 28.51,13.34 23.78,5.21" />
      </g>
    </svg>
  );
};

export default ArrowLineIcon;
