"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NavBar = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleSubMenu = () => {
    setIsSubMenuOpen(!isSubMenuOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
        setIsSubMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav className={`absolute top-0 w-full flex items-center justify-between px-4 py-2 md:px-8 md:py-4 z-50 ${pathname === "/" ? "bg-transparent" : "bg-color3"}`}>
      <div className="w-32 md:w-48">
        <img src="/logos/longs/tokeshare-07.png" alt="Logo Tokeshare" className="w-full h-auto" />
      </div>
      <div className="hidden md:flex justify-center w-1/2">
        <ul className="flex justify-between w-full space-x-6 md:space-x-8">
          <li>
            <Link href="/" className={`text-color1 text-3xl md:text-2xl ${pathname === "/" ? "font-titleBold" : "font-titleSemibold"}`}>
              Home
            </Link>
          </li>
          <li className="relative">
            <button onClick={toggleSubMenu} className={`text-color1 text-3xl md:text-2xl ${pathname === "/marketplace" ? "font-titleBold" : "font-titleSemibold"}`}>
              Market place
            </button>
            {isSubMenuOpen && (
              <ul className="absolute top-full left-0 mt-2 w-48 bg-color3 text-color1 rounded-lg shadow-lg">
                <li>
                  <Link href="/marketplace/real-estate" className="block px-4 py-2 hover:brightness-200 transition">
                    Real Estate
                  </Link>
                </li>
                <li>
                  <Link href="/marketplace/commodities" className="block px-4 py-2 hover:brightness-200 transition">
                    Commodities
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li>
            <Link href="/about" className={`text-color1 text-3xl md:text-2xl ${pathname === "/about" ? "font-titleBold" : "font-titleSemibold"}`}>
              About Us
            </Link>
          </li>
          <li>
            <Link href="/learn" className={`text-color1 text-3xl md:text-2xl ${pathname === "/learn" ? "font-titleBold" : "font-titleSemibold"}`}>
              Learn
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <button className="rounded-lg border-2 border-white px-4 py-1 md:px-6 md:py-2 text-sm md:text-lg text-white hover:bg-white hover:text-black transition">My Account</button>
      </div>

      <div className="md:hidden">
        <button onClick={toggleMenu} className="text-white text-2xl focus:outline-none">
          {isMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute top-16 right-4 w-64 bg-gray-800 bg-opacity-90 text-white rounded-lg shadow-lg z-50">
          <ul className="flex flex-col items-start space-y-4 p-6">
            <li>
              <Link href="/" onClick={toggleMenu} className={`text-color1 text-2xl ${pathname === "/" ? "font-title" : "font-text"}`}>
                Home
              </Link>
            </li>
            <li className="relative">
              <button onClick={toggleSubMenu} className={`text-color1 text-lg  ${pathname === "/marketplace" ? "font-title" : "font-text"}`}>
                Market place
              </button>
              {isSubMenuOpen && (
                <ul className="absolute top-full left-0 mt-2 w-48 bg-gray-800 text-white rounded-lg shadow-lg">
                  <li>
                    <Link href="/marketplace/real-estate" onClick={toggleMenu} className="block px-4 py-2 hover:bg-gray-700">
                      Real Estate
                    </Link>
                  </li>
                  <li>
                    <Link href="/marketplace/commodities" onClick={toggleMenu} className="block px-4 py-2 hover:bg-gray-700">
                      Commodities
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <Link href="/about" onClick={toggleMenu} className={`text-color1 text-lg ${pathname === "/about" ? "font-title" : "font-text"}`}>
                About Us
              </Link>
            </li>
            <li>
              <Link href="/learn" onClick={toggleMenu} className={`text-color1 text-lg ${pathname === "/learn" ? "font-title" : "font-text"}`}>
                Learn
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
