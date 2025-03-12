'use client'

import React, { useState, useEffect, useContext } from 'react'
import TradeWidget from '@/app/components/shared/TradeWidget'
import BankIcon from '@/app/components/icons/BankIcon'
import Blockchains from '@/app/components/Blockchains'
import { fetchPAXGPrice, calculateTGGPrice } from '@/app/utils/priceUtils'
import ConnectButton from '@/app/components/shared/ConnectButton'
import { useAccount } from 'wagmi'
import UserForm from './UserForm'
import { TokenContexts } from '@/app/context/TokenContexts'

const Buy = () => {
  // Get values from context
  const { 
    buy: { token: selectedCurrency, blockchain: selectedBlockchain },
    updateBuyToken: setSelectedCurrency,
    updateBuyBlockchain: setSelectedBlockchain
  } = useContext(TokenContexts);

  // Local state
  const [amountToSend, setAmountToSend] = useState("10")
  const [tggAmount, setTggAmount] = useState("0")
  const [tggPrice, setTggPrice] = useState<number>(0)
  const [showBuyNext, setShowBuyNext] = useState(false)
  const { isConnected } = useAccount()

  // Mise à jour du prix TGG
  useEffect(() => {
    const updatePrice = async () => {
      const paxgPrice = await fetchPAXGPrice();
      const calculatedTggPrice = calculateTGGPrice(paxgPrice);
      setTggPrice(calculatedTggPrice);
    };
    updatePrice();
    const interval = setInterval(updatePrice, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calcul initial du montant TGG
  useEffect(() => {
    if (tggPrice > 0) {
      calculateTggFromFiat(amountToSend);
    }
  }, [tggPrice]);

  // Calcule le montant TGG à partir du montant fiat
  const calculateTggFromFiat = (fiatAmount: string) => {
    if (tggPrice > 0) {
      const numericAmount = parseFloat(fiatAmount) || 0;
      const calculatedTggAmount = (numericAmount / tggPrice).toFixed(4);
      setTggAmount(calculatedTggAmount);
    }
  };

  // Calcule le montant fiat à partir du montant TGG
  const calculateFiatFromTgg = (tggValue: string) => {
    if (tggPrice > 0) {
      const numericAmount = parseFloat(tggValue) || 0;
      const calculatedFiatAmount = (numericAmount * tggPrice).toFixed(2);
      setAmountToSend(calculatedFiatAmount);
    }
  };

  // Gestion du changement de montant en devise fiat
  const handleFiatAmountChange = (amount: string) => {
    if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
      setAmountToSend(amount);
      calculateTggFromFiat(amount);
    }
  };

  // Gestion du changement de montant en TGG
  const handleTggAmountChange = (amount: string) => {
    if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
      setTggAmount(amount);
      calculateFiatFromTgg(amount);
    }
  };

  if (showBuyNext) {
    return <UserForm type="buy" amount={amountToSend} currency={selectedCurrency} tggAmount={tggAmount} tggPrice={tggPrice} />
  }

  return (
    <div className="p-6 w-full relative">
      {/* Bouton Bank transfer */}
      <div className="w-full bg-blue-600 text-white py-3 rounded-xl mb-6 flex items-center justify-center gap-3 shadow-md ">
        <BankIcon />  
        <span className="font-medium">Bank transfer</span>
      </div>

      {/* Champ de saisie pour le montant envoyé dans la devise sélectionnée */}
      <TradeWidget
        type="fiat"
        label="YOU SEND"
        defaultToken={selectedCurrency}
        value={amountToSend}  
        onValueChange={handleFiatAmountChange}
        onTokenChange={setSelectedCurrency}
      />

      <div className="my-4" />

      {/* Affichage du montant en TGG */}
      <TradeWidget
        label="YOU RECEIVE"
        defaultToken="TGG"
        value={tggAmount}
        onValueChange={handleTggAmountChange}
        onTokenChange={() => {}} // TGG ne peut pas être changé
        type="crypto"
      />

      <div className="mb-6 mt-4 space-y-2">
        <Blockchains section="buy" />
        <div className="space-y-1 ml-2">
          <p className="text-color4 text-sm font-medium">TGG Price: ${tggPrice.toFixed(2)}</p>
          <p className="text-color4 text-sm font-medium">Delivery time: 0 - 2 Days</p>
        </div>
      </div>

      <div className="mt-6">
        {isConnected ? (
          <button
            onClick={() => setShowBuyNext(true)}
            className="w-full bg-color4 text-white py-3 rounded-xl font-medium shadow-sm hover:bg-opacity-90 transition-all duration-200"
          >
            Buy
          </button>
        ) : (
          <button
            onClick={() => setShowBuyNext(true)}
            className="w-full bg-color4 text-white py-3 rounded-xl font-medium shadow-sm hover:bg-opacity-90 transition-all duration-200"
          >
            Buy
          </button>
        )}
      </div>
    </div>
  )
}

export default Buy
