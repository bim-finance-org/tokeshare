'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import StellarIcon from '@/components/icons/blockchains/StellarIcon';

const StellarBanner: React.FC = () => {
  const pathname = usePathname();

  // On the home page the navbar floats over the hero (absolute top-0). The
  // banner overlays the very top there so the hero stays full-height; on every
  // other page it sits in normal flow above the navbar. Height stays fixed at
  // h-10 so the home navbar can offset itself with a matching top-10.
  const positionClass = pathname === '/' ? 'absolute top-0 left-0 w-full' : 'relative w-full';

  return (
    <Link
      href="/poc-stellar"
      aria-label="Discover the Tokeshare Stellar POC"
      className={`group z-[60] flex h-10 items-center justify-center gap-2 overflow-hidden bg-gradient-to-r from-color4 via-[#1b1f3b] to-color2 px-4 text-color7 transition-colors hover:via-[#232a55] ${positionClass}`}
    >
      <StellarIcon size={22} className="shrink-0 ring-1 ring-white/20" />
      <span className="rounded-full bg-color2/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-color5">
        New
      </span>
      <span className="truncate text-xs font-titleSemibold sm:text-sm">
        <span className="hidden sm:inline">Try our </span>Stellar POC
        <span className="hidden md:inline"> — buy tokenized real estate on Stellar</span>
      </span>
      <span aria-hidden="true" className="shrink-0 transition-transform duration-300 group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
};

export default StellarBanner;
