import React from 'react'
import Link from 'next/link'

const Contracts = ({polygonContract, baseContract}: {polygonContract: string, baseContract: string}) => {
  return (
    <div className="flex items-center gap-4">
      <h1 className="text-xl text-color4 font-medium">VIEW SMART CONTRACTS</h1>
      <div className="flex gap-2">
        <Link 
          href={polygonContract}
          className="w-20 flex items-center justify-center px-6 py-2 bg-color2 text-color1 rounded hover:scale-105 transition"
        >
          POL
        </Link>
        <Link 
          href={baseContract}
          className="w-20 flex items-center justify-center px-6 py-2 bg-color4 text-color1 rounded hover:scale-105 transition"
        >
          BASE
        </Link>
      </div>
    </div>
  )
}

export default Contracts