import React from 'react';
import Image from 'next/image';

interface StellarIconProps {
  size?: number;
  className?: string;
}

// Official Stellar mark (white) centered on a black circular badge, so it reads
// well on both light and dark backgrounds. className applies to the badge (e.g.
// ring utilities passed by call sites).
const StellarIcon = ({ size = 24, className = '' }: StellarIconProps) => {
  const inner = Math.round(size * 0.72);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-black ${className}`}
      style={{ width: size, height: size }}
      aria-label="Stellar"
    >
      <Image src="/logos/stellar.png" alt="Stellar" width={inner} height={inner} className="object-contain" />
    </span>
  );
};

export default StellarIcon;
