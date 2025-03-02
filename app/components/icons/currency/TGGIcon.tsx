import React from 'react'
import Image from 'next/image'

interface TGGIconProps {
  size?: number
  className?: string
}

const TGGIcon = ({ size = 20, className = '' }: TGGIconProps) => {
  return (
        <Image src="/images/currencies/tgg.png" alt="TGG" width={size} height={size} className={` ${className} rounded-full`} />
  )
}

export default TGGIcon