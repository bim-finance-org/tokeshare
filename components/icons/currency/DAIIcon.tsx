import React from 'react'
import Image from 'next/image'

interface DAIIconProps {
  size?: number
  className?: string
}

const DAIIcon = ({ size = 24, className = '' }: DAIIconProps) => {
  return (
    <Image
      src="/images/currencies/daiLogo.png"
      alt="DAI"
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  )
}

export default DAIIcon