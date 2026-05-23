'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import MobileMenu from '@/components/layout/MobileMenu';
import Head from 'next/head';
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
];

const NavBar: React.FC<NavBarProps> = () => {
  const pathname = usePathname();

  const classNav =
    pathname === '/'
      ? 'bg-transparent text-color1 absolute top-0 w-full flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 py-3 md:py-4 z-50'
      : 'bg-color3 w-full flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 py-3 md:py-4 z-50 transition-all duration-300 hover:shadow-lg';

  return (
    <>
      <Head>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SiteNavigationElement',
            name: NAV_ITEMS.map((i) => i.name),
            url: NAV_ITEMS.map((i) => i.path),
          })}
        </script>
      </Head>

      <nav role="navigation" aria-label="Main Navigation" className={classNav}>
        {/* Logo */}
        <div className="w-24 md:w-32">
          <Link href="/" aria-label="Go to Home Page">
            <Image
              src="/logos/longs/tokeshare-07.webp"
              alt="Tokeshare Logo"
              width={128}
              height={64}
              className="w-full h-auto hover:scale-105 transition-transform"
            />
          </Link>
        </div>

        {/* Menu hamburger (mobile) */}
        <MobileMenu />

        {/* Menu Desktop */}
        <div className="hidden custom-r:flex justify-center flex-1 max-w-screen-lg px-4 sm:px-6 md:px-8 lg:px-12">
          <ul className="flex justify-between w-full space-x-4 md:space-x-6 lg:space-x-10">
            {NAV_ITEMS.map(({ name, path }, index) => (
              <li key={index} className="relative flex items-center">
                <Link
                  href={path}
                  className={`
                    whitespace-nowrap font-titleSemibold transition-transform transform hover:scale-105 text-shadow-lg
                    ${pathname === path ? 'text-lg lg:text-2xl font-bold' : 'text-xl font-light'}
                  `}
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Bouton My Account */}
        <div>
          <ConnectButton isTransparent={true} navbarButton={true} />
        </div>
      </nav>
    </>
  );
};

export default NavBar;
