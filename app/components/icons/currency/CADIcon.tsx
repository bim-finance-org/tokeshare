import Image from 'next/image'
import React from 'react'

interface CADIconProps {
  size?: number
  className?: string
}

const CADIcon = ({ size = 24, className = '' }: CADIconProps) => {
  return (
    <Image
      src="/icons/currency/cad.png"
      alt="CAD"
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  )
}

export default CADIcon
