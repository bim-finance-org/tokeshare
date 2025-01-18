"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileMenu from "./MobileMenu";

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
    <nav className={`w-full flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 py-3 md:py-4 z-50 transition-all duration-300 hover:shadow-lg ${pathname === "/" ? "bg-transparent text-color1" : "bg-color3"} ${customClass}`}>
      <div className="w-24 md:w-32">
        <Link href="/">
          <img src="/logos/longs/tokeshare-07.png" alt="Logo Tokeshare" className="w-full h-auto hover:scale-105 transition-transform" />
        </Link>
      </div>
      <MobileMenu />

      <div className="hidden md:flex justify-center w-2/3 max-w-screen-lg px-4 sm:px-6 md:px-8 lg:px-12">
        <ul className="flex justify-between w-full space-x-4 md:space-x-8 lg:space-x-12">
          {[
            { name: "Home", path: "/" },
            { name: "Market place", path: "" },
            { name: "About Us", path: "/about" },
            { name: "Learn", path: "/learn" },
          ].map(({ name, path }, index) => (
            <li key={index} className="relative flex items-center">
              {name === "Market place" ? (
                <button ref={marketPlaceRef} onClick={toggleSubMenu} className="flex items-center text-lg whitespace-nowrap font-titleSemibold hover:text-gray-300 transition-colors">
                  {name}
                  <img src="/icons/bottomArrowIcon.png" alt="" className={`size-5 ml-2 transition-transform  ${isSubMenuOpen ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <Link href={path} className="text-lg whitespace-nowrap font-titleSemibold hover:text-gray-300 transition-colors">
                  {name}
                </Link>
              )}
              {name === "Market place" && isSubMenuOpen && (
                <ul ref={subMenuRef} className={`absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-48 bg-color3 text-white shadow-lg rounded-lg overflow-hidden z-50 p-2 transition-all duration-300 ${pathname === "/" ? "bg-transparent text-color1" : "bg-color3"}`}>
                  {[
                    { name: "Real Estate", path: "/marketplace/real-estate" },
                    { name: "Commodities", path: "/marketplace/commodities" },
                  ].map(({ name, path }, idx) => (
                    <li key={idx} className="text-center py-1">
                      <Link href={path} className="block px-4 py-2 text-lg rounded-lg hover:bg-color1 hover:text-white transition-colors font-titleSemibold">
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
        <button className="rounded-lg border-2 border-white px-2 sm:px-3 md:px-4 py-1 text-xs sm:text-sm md:text-base lg:text-lg text-white hover:bg-white hover:text-black transition-all duration-300">My Account</button>
      </div>
    </nav>
  );
};

export default NavBar;
