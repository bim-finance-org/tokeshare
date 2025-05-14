import React from 'react'
import Image from 'next/image'

interface USDCIconProps {
  size?: number
  className?: string
}

const USDCIcon = ({ size = 24, className = '' }: USDCIconProps) => {
  return (
    <Image
      src="/images/currencies/usdcLogo.png"
      alt="USDC"
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  )
}

export default USDCIcon