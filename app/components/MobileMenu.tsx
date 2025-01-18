"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MobileMenu: React.FC = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleSubMenu = () => setIsSubMenuOpen(!isSubMenuOpen);

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className="md:hidden" ref={menuRef}>
      <button onClick={toggleMenu} className="text-white text-2xl focus:outline-none hover:scale-110 transition-transform">
        {isMenuOpen ? "✕" : "☰"}
      </button>

      {isMenuOpen && (
        <div className={`absolute top-14 left-1/2 transform -translate-x-1/2 w-2/3 bg-color3 text-white shadow-lg md:hidden rounded-b-xl transition-all duration-300 ${pathname === "/" ? "bg-transparent text-color1" : "bg-color3"}`}>
          <ul className="flex flex-col items-start space-y-4 p-6">
            {[
              { name: "Home", path: "/" },
              { name: "Market place", path: "" },
              { name: "About Us", path: "/about" },
              { name: "Learn", path: "/learn" },
            ].map(({ name, path }, index) => (
              <li key={index} className="relative w-full">
                {name === "Market place" ? (
                  <button onClick={toggleSubMenu} className="text-lg flex items-center w-full hover:text-gray-300 transition-colors">
                    {name}
                    <img src="/icons/bottomArrowIcon.png" alt="" className={`ml-2 size-6 transition-transform ${isSubMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <Link href={path} onClick={toggleMenu} className="text-lg block w-full hover:text-gray-300 transition-colors">
                    {name}
                  </Link>
                )}
                {name === "Market place" && isSubMenuOpen && (
                  <ul className="pl-4 mt-2 space-y-2">
                    <li>
                      <Link href="/marketplace/real-estate" className="block text-sm font-titleSemibold hover:text-gray-300 transition-colors" onClick={toggleMenu}>
                        Real Estate
                      </Link>
                    </li>
                    <li>
                      <Link href="/marketplace/commodities" className="block text-sm font-titleSemibold hover:text-gray-300 transition-colors" onClick={toggleMenu}>
                        Commodities
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MobileMenu;
