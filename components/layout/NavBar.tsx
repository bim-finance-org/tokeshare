'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Script from 'next/script';
import MobileMenu from '@/components/layout/MobileMenu';
import ConnectButton from '@/components/shared/ConnectButton';

interface NavBarProps {
  customClass?: string;
}

const NAV_ITEMS = [
  { name: 'Home', path: '/' },
  { name: 'Real Estate', path: '/marketplace/real-estate' },
  { name: 'Commodities', path: '/marketplace/commodities' },
  { name: 'Stock & ETF', path: '/marketplace/stock-etf' },
  { name: 'Other', path: '/marketplace/other' },
  { name: 'Partners', path: '/partners' },
  { name: 'Dashboard', path: '/user/dashboard' },
] as const;

const NavBar: React.FC<NavBarProps> = () => {
  const pathname = usePathname();
  const isHome = pathname === '/';

  // Home: transparent bar overlaying the hero. Everywhere else: a sticky navy
  // bar consistent with the footer / cards.
  const barClass = isHome
    ? 'absolute top-6 sm:top-10 left-0 z-50 w-full'
    : 'sticky top-0 z-50 w-full border-b border-white/10 bg-color4';

  return (
    <>
      <Script
        id="navbar-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SiteNavigationElement',
            name: NAV_ITEMS.map((i) => i.name),
            url: NAV_ITEMS.map((i) => i.path),
          }),
        }}
      />

      <nav role="navigation" aria-label="Main Navigation" className={barClass}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 md:py-4 lg:px-10">
          {/* Logo */}
          <div className="w-24 shrink-0 md:w-28">
            <Link href="/" aria-label="Go to Home Page">
              <Image
                src="/logos/longs/tokeshare-07.webp"
                alt="Tokeshare Logo"
                width={128}
                height={64}
                className="h-auto w-full transition-transform hover:scale-105"
              />
            </Link>
          </div>

          {/* Desktop menu */}
          <ul className="hidden items-center gap-5 custom-r:flex lg:gap-8">
            {NAV_ITEMS.map(({ name, path }) => {
              const active = pathname === path;
              return (
                <li key={path}>
                  <Link
                    href={path}
                    className={`relative whitespace-nowrap py-1 text-[15px] font-titleSemibold transition-colors ${
                      active ? 'text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {name}
                    {active && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-color2" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right side: connect + mobile trigger */}
          <div className="flex shrink-0 items-center gap-2">
            <ConnectButton isTransparent={true} navbarButton={true} />
            <MobileMenu />
          </div>
        </div>
      </nav>
    </>
  );
};

export default NavBar;
