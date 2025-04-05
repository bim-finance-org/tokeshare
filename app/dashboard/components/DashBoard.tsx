'use client'

import React, { useState } from 'react'
import BuyModal from './BuyModal'
import SellModal from './SellModal'
import Create from './Create'

const DashBoard = () => {
    const [isBuyOpen, setIsBuyOpen] = useState(true)
    const [isSellOpen, setIsSellOpen] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const handleBuy = () => {
      setIsBuyOpen(true)
      setIsSellOpen(false)
      setIsCreateOpen(false)
    }
  
    const handleSell = () => {
      setIsBuyOpen(false)
      setIsSellOpen(true)
      setIsCreateOpen(false)
    }
  
    const handleCreate = () => {
      setIsBuyOpen(false)
      setIsSellOpen(false)
      setIsCreateOpen(true)
    }
  
    return (
      <div>
        <div className='flex flex-col items-center justify-center gap-4'>
          <h1 className='text-2xl text-black font-bold'>Dashboard</h1>
          <div className='flex gap-4 pb-4'>
          <button onClick={handleBuy} className='bg-blue-500 text-white px-4 py-2 rounded-md'>Buy</button>
          <button onClick={handleSell} className='bg-blue-500 text-white px-4 py-2 rounded-md'>Sell</button>
          <button onClick={handleCreate} className='bg-blue-500 text-white px-4 py-2 rounded-md'>Create</button>
          </div>
        </div>
        {isBuyOpen && <BuyModal />}
        {isSellOpen && <SellModal />}
        {isCreateOpen && <Create />}
      </div>
    )
}

export default DashBoard