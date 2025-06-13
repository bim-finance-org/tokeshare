'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import NavBar from './NavBar'
import Footer from './Footer'
import { StablecoinPriceInitializer } from './StablecoinPriceInitializer'

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isDashboardRoute = pathname.startsWith('/dashboard')

  return (
    <>
      {/* Initialise le chargement des prix des stablecoins */}
      <StablecoinPriceInitializer />
      
      {!isDashboardRoute && <NavBar />}
      {children}
      {!isDashboardRoute && <Footer />}
    </>
  )
} 