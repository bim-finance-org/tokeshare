import React from 'react'

interface CHFIconProps {
  size?: number
  className?: string
}

const CHFIcon = ({ size = 24, className = '' }: CHFIconProps) => {
  return (
    <svg height={size} width={size} className={`rounded-full mr-2 ${className}`} xmlns="http://www.w3.org/2000/svg" viewBox="-13,-13 26,26">
          <circle r="13" fill="#D52B1E"/>
          <path d="M-10,0h20M0-10v20" stroke="#fff" strokeWidth="6"/>
      </svg>


  )
}

export default CHFIcon