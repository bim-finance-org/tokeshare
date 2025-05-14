import Image from 'next/image'
import React from 'react'

interface EURCIconProps {
  size?: number
  className?: string
}

const EURCIcon = ({ size = 24, className = '' }: EURCIconProps) => {
  return (
    <Image
      src="/images/currencies/eurc.webp"
      alt="EURC"
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  )
}

export default EURCIcon
