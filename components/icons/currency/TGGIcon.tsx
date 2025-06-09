import React from 'react'
import Image from 'next/image'

interface TGGIconProps {
  size?: number
  className?: string
}

const TGGIcon = ({ className = '' }: TGGIconProps) => {
  return (
        <Image src="/images/currencies/tgg.png" alt="TGG" width={17} height={17} className={` ${className} rounded-full`} />
  )
}

export default TGGIcon