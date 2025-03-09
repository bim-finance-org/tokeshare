'use client'

import React, { useState, useEffect, useContext } from 'react'
import TradeWidget from '../../../components/shared/TradeWidget'
import BankIcon from '@/app/components/icons/BankIcon'
import Blockchains from '@/app/components/Blockchains'
import { fetchPAXGPrice, calculateTGGPrice } from '@/app/utils/priceUtils'
import ConnectButton from '@/app/components/shared/ConnectButton'
import { useAccount } from 'wagmi'
import UserForm from './UserForm'
import { TokenContexts } from '@/app/context/TokenContexts'

const Sell = () => {
  // Get values from context
  const { 
    sell: { token: selectedCurrency, blockchain: selectedBlockchain },
    updateSellToken: setSelectedCurrency,
    updateSellBlockchain: setSelectedBlockchain
  } = useContext(TokenContexts);

  // Local state
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)
  const [amountToSell, setAmountToSell] = useState('10')
  const [tggPrice, setTggPrice] = useState<number>(0)
  const [showUserForm, setShowUserForm] = useState(false)
  const { isConnected } = useAccount()

  useEffect(() => {
    const updatePrice = async () => {
      const paxgPrice = await fetchPAXGPrice();
      const calculatedTggPrice = calculateTGGPrice(paxgPrice);
      setTggPrice(calculatedTggPrice);
    };
    updatePrice();
    // Update price every 5 seconds
    const interval = setInterval(updatePrice, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleReceiveAmount = () => {
    const tggAmount = parseFloat(amountToSell) || 0;
    return (tggAmount * tggPrice).toFixed(4);
  }

  if (showUserForm) {
    return (
      <div className="p-6 w-full text-color4 max-w-md mx-auto bg-gray-100 rounded-2xl shadow-md space-y-4">
        <div className="bg-gray-200 p-4 rounded-xl">
          <h1 className="text-xl font-bold mb-2">Reception address</h1>
          <p className="text-gray-600">Network: {selectedBlockchain}</p>
        </div>
        <UserForm 
          type="sell"
          amount={handleReceiveAmount()}
          currency={selectedCurrency}
          tggAmount={amountToSell}
          tggPrice={tggPrice}
        />
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      <div className="w-full bg-blue-600 text-white py-3 rounded-xl mb-6 flex items-center justify-center gap-3 shadow-md">
        <BankIcon />
        <span className="font-medium">Bank transfer</span>
      </div>

      <TradeWidget
        label="YOU SEND"
        defaultToken="TGG"
        onValueChange={(value) => setAmountToSell(value)}
        onTokenChange={(token) => setSelectedCurrency(token)}
        type="crypto"
        value={amountToSell}
        blockchain={selectedBlockchain}
        showBalance={true}
      />

      <div className="my-4" />

      <TradeWidget
        label="YOU RECEIVE"
        defaultToken={selectedCurrency}
        onValueChange={(value) => setAmountToSell(value)}
        onTokenChange={(token) => setSelectedCurrency(token)}
        type="fiat"
        value={handleReceiveAmount()}
        blockchain={selectedBlockchain}
      />

      <div className="mb-6 mt-4 space-y-2">
        <Blockchains section="sell" />
        <div className="space-y-1 ml-2">
          <p className="text-color4 text-sm font-medium">TGG Price: ${tggPrice.toFixed(2)}</p>
          <p className="text-color4 text-sm font-medium">Delivery time: 0 - 2 Days</p>
        </div>
      </div>

      <div className="mt-6">
        {isConnected ? (
          <button
            onClick={() => setShowUserForm(true)}
            className="w-full bg-color4 text-white py-3 rounded-xl font-medium shadow-sm hover:bg-opacity-90 transition-all duration-200"
          >
            Sell
          </button>
        ) : (
          <ConnectButton
            connectText="Connect Wallet"
            connectedText="Sell"
          />
        )}
      </div>
    </div>
  )
}

export default Sell