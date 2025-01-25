"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileMenu from "./MobileMenu";
import ArrowDownIcon from "./icons/ArrowDownIcon";
import CrossIcon from "./icons/CrossIcon";

interface NavBarProps {
  customClass?: string;
}

const NavBar: React.FC<NavBarProps> = ({ customClass }) => {
  const pathname = usePathname();
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const subMenuRef = useRef<HTMLUListElement>(null);
  const marketPlaceRef = useRef<HTMLButtonElement>(null);

  const toggleSubMenu = () => setIsSubMenuOpen(!isSubMenuOpen);

  const handleClickOutside = (event: MouseEvent) => {
    if (subMenuRef.current && !subMenuRef.current.contains(event.target as Node) && marketPlaceRef.current && !marketPlaceRef.current.contains(event.target as Node)) {
      setIsSubMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <nav className={`w-full  flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 py-3 md:py-4 z-50 transition-all duration-300 hover:shadow-lg ${pathname === "/" ? "bg-transparent text-color1 backdrop-filter backdrop-blur-xs" : "bg-color3"} ${customClass}`}>
      <div className="w-24 md:w-32">
        <Link href="/">
          <img src="/logos/longs/tokeshare-07.png" alt="Logo Tokeshare" className="w-full h-auto hover:scale-105 transition-transform" />
        </Link>
      </div>
      <MobileMenu />

      <div className="hidden md:flex justify-center w-1/3 md:w-3/5 max-w-screen-lg px-4 sm:px-6 md:px-8 lg:px-12">
        <ul className="flex justify-between w-full space-x-4 md:space-x-8 lg:space-x-12">
          {[
            { name: "Home", path: "/" },
            { name: "Market place", path: "" },
            { name: "About Us", path: "/about" },
            { name: "Learn", path: "/learn" },
          ].map(({ name, path }, index) => (
            <li key={index} className="relative flex items-center">
              {name === "Market place" ? (
                <button
                  ref={marketPlaceRef}
                  onClick={toggleSubMenu}
                  className={`flex items-center whitespace-nowrap font-titleSemibold transition-transform transform hover:scale-105
                    ${pathname === path ? "text-lg lg:text-2xl font-bold" : "text-xl font-light"}`}
                >
                  {name}
                  {isSubMenuOpen ? <CrossIcon size={30} className="ml-1 pointer-events-none" /> : <ArrowDownIcon size={36} className="ml-1 pointer-events-none" />}
                </button>
              ) : (
                <Link
                  href={path}
                  className={`whitespace-nowrap font-titleSemibold transition-transform transform hover:scale-105
                  ${pathname === path ? "text-lg lg:text-2xl font-bold" : "text-xl font-light"}`}
                >
                  {name}
                </Link>
              )}
              {name === "Market place" && isSubMenuOpen && (
                <ul ref={subMenuRef} className={`absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-48  text-white rounded-lg overflow-hidden z-20 p-2   ${pathname === "/" ? "text-color1 backdrop-blur-xs backdrop-filter " : "bg-color3"}`}>
                  {[
                    { name: "Real Estate", path: "/marketplace/real-estate" },
                    { name: "Commodities", path: "/marketplace/commodities" },
                  ].map(({ name, path }, idx) => (
                    <li key={idx} className="text-center py-1 ">
                      <Link
                        href={path}
                        className={`block px-4 py-2 rounded-lg hover:scale-105 font-titleSemibold
                        ${pathname === path ? "text-lg lg:text-2xl font-bold" : "text-xl font-light"}`}
                      >
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <Link href="/buildingInProgress">
          <button className="rounded-lg border-2 border-white px-2 sm:px-3 md:px-4 py-1 text-xs sm:text-sm md:text-base lg:text-lg text-white hover:bg-white hover:text-black transition-all duration-300">My Account</button>
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
