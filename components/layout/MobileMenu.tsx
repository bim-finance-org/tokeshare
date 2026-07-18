// MobileMenu.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CrossIcon from '@/components/icons/CrossIcon';
import MenuIcon from '@/components/icons/MenuIcon';

const MobileMenu: React.FC = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="custom-r:hidden text-color7 z-50" ref={menuRef}>
      <button type="button"
        onClick={toggleMenu}
        className="text-color7 text-2xl focus:outline-none hover:scale-110"
        aria-label="Toggle Menu"
      >
        {isMenuOpen ? (
          <CrossIcon size={32} className="pointer-events-none" />
        ) : (
          <MenuIcon size={32} className="pointer-events-none" />
        )}
      </button>

      {isMenuOpen && (
        <div
          className={`absolute left-1/2 top-14 w-full -translate-x-1/2 rounded-b-2xl border-t border-white/10 shadow-xl transition-all duration-300 custom-r:hidden ${
            pathname === '/' ? 'bg-black/70 backdrop-blur-md' : 'bg-color4'
          }`}
        >
          <ul className="flex flex-col gap-1 p-3">
            {([
              { name: 'Home', path: '/' },
              { name: 'Real Estate', path: '/marketplace/real-estate' },
              { name: 'Commodities', path: '/marketplace/commodities' },
              { name: 'Stock & ETF', path: '/marketplace/stock-etf' },
              { name: 'Other', path: '/marketplace/other' },
              { name: 'Partners', path: '/partners' },
              { name: 'Dashboard', path: '/user/dashboard' },
            ] as const).map(({ name, path }) => {
              const active = pathname === path;
              return (
                <li key={path} className="w-full">
                  <Link
                    href={path}
                    onClick={toggleMenu}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-titleSemibold transition-colors ${
                      active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-color2" />}
                    {name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MobileMenu;
