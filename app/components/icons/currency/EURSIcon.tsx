import React from 'react'
import Image from 'next/image'

interface EURSIconProps {
  size?: number
  className?: string
}

const EURSIcon = ({ size = 24, className = '' }: EURSIconProps) => {
  return (
    <Image
      src="/icons/currency/eurs.png"
      alt="EURS"
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  )
}

export default EURSIcon