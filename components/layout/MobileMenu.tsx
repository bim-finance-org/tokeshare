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
      <button
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
          className={`absolute top-14 left-1/2 transform -translate-x-1/2 w-full bg-color3 shadow-lg custom-r:hidden rounded-b-xl transition-all duration-300 ${pathname === '/' ? 'bg-transparent text-color7' : 'bg-color3'}`}
        >
          <ul className="flex flex-col items-start space-y-4 p-6">
            {[
              { name: 'Home', path: '/' },
              { name: 'Real Estate', path: '/marketplace/real-estate' },
              { name: 'Commodities', path: '/marketplace/commodities' },
              { name: 'Stock & ETF', path: '/marketplace/stock-etf/tmc' },
              { name: 'Other', path: '/marketplace/other' },
              { name: 'About Us', path: '/about' },
              { name: 'Learn', path: '/learn' },
            ].map(({ name, path }, index) => (
              <li key={index} className="relative w-full">
                <Link
                  href={path}
                  onClick={toggleMenu}
                  className={`text-lg font-bold block w-full hover:text-gray-300 transition-colors [text-shadow:_0_1px_0_rgb(0_0_0_/_40%)] ${pathname === '/' ? 'text-color1' : 'text-color1'}`}
                >
                  <h3>{name}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MobileMenu;
