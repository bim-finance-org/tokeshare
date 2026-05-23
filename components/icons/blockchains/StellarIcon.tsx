import React from 'react';

interface StellarIconProps {
  size?: number;
  className?: string;
}

const StellarIcon = ({ size = 24, className = '' }: StellarIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 287 286"
      width={size}
      height={size}
      className={`rounded-full bg-black p-1 ${className}`}
      aria-label="Stellar"
    >
      <path
        fill="#ffffff"
        d="M283 64.6L237.5 87.7 49.2 183.5 23.4 196.6 0 184.8l28.6-14.6 199.2-101.4 14.2-7.2 8.1-4.1L283 64.6zM283 121.2L57 236.2l-14.4-7.4 213.4-108.6 26.9-13.7v14.7zM34.9 113.3v-14.7l16.8 8.6L60 111.4 277.9 0.4l3 1.5L283 3v14.7l-16.2 8.2L48 137.6 34.9 130.9zM229.6 156.6L283 129.4 283 144.1 234.6 168.7zM34.9 169.9l60.1-30.6 19 9.7 5.9 3 -25 12.7L34.9 184.6 19.9 192.3 19.9 177.6 34.9 169.9zM23.4 234.1L211.7 138.2 237.5 125.1 263.4 138.2 283 148.2 283 162.9 263.4 152.9 237.5 139.7 49.2 235.6 25.8 247.5 0 234.4 19.9 224.3 23.4 222.5z"
      />
    </svg>
  );
};

export default StellarIcon;
