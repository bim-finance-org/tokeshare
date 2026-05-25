'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import NavBar from './NavBar';
import Footer from './Footer';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboardRoute = pathname.startsWith('/dashboard');

  return (
    <>
      {!isDashboardRoute && <NavBar />}
      {children}
      {!isDashboardRoute && <Footer />}
    </>
  );
}
