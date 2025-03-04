import React, { useState, useEffect } from 'react'
import CurrencyInput from '@/app/components/shared/CurrencyInput'
import BuyNext from './BuyNext'
import BankIcon from '@/app/components/icons/BankIcon'
import Blockchains from '@/app/components/Blockchains'
import { fetchPAXGPrice, calculateTGGPrice } from '@/app/utils/priceUtils'

const Buy = () => {
  // Initialize with localStorage value or default
  const [selectedCurrency, setSelectedCurrency] = useState(() => 
    localStorage.getItem('buySelectedCurrency') || 'EUR'
  )
  // État pour la somme que l'utilisateur envoie
  const [amountToSend, setAmountToSend] = useState('10')
  const [showBuyNext, setShowBuyNext] = useState(false)
  const [tggPrice, setTggPrice] = useState<number>(0)

  // Save currency to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('buySelectedCurrency', selectedCurrency)
  }, [selectedCurrency])

  useEffect(() => {
    const updatePrice = async () => {
      const paxgPrice = await fetchPAXGPrice();
      const calculatedTggPrice = calculateTGGPrice(paxgPrice);
      setTggPrice(calculatedTggPrice);
    };
    updatePrice();
    // Update price every 30 seconds
    const interval = setInterval(updatePrice, 30000);
    return () => clearInterval(interval);
  }, []);

  // Conversion to TGG based on TGG price
  const handleReceiveAmount = () => {
    const numericValue = parseFloat(amountToSend) || 0;
    return (numericValue / tggPrice).toFixed(4);
  }

  if (showBuyNext) {
    return <BuyNext />
  }

  return (
    <div className="p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 w-full relative">
      {/* Bouton Bank transfer (exemple) */}
      <div className="w-full bg-blue-600 text-white py-3 rounded-xl mb-6 flex items-center justify-center gap-3 shadow-md ">
        <BankIcon />  
        <span className="font-medium">Bank transfer</span>
      </div>

      {/* Champ de saisie pour le montant envoyé dans la devise sélectionnée */}
      <CurrencyInput
        label="YOU SEND"
        value={amountToSend}
        currency={selectedCurrency}
        onChangeValue={setAmountToSend}
        onCurrencySelect={setSelectedCurrency}
      />

      <div className="my-4" />

      {/* Affichage du montant en TGG (non sélectionnable car on reçoit toujours du TGG) */}
      <CurrencyInput
        label="YOU RECEIVE"
        value={handleReceiveAmount()}
        currency="TGG"
        isSelectable={false}
        disabled={true}
      />

      <div className="mb-6 mt-4 space-y-2">
        <Blockchains section="buy" />
        <div className="space-y-1 ml-2">
          <p className="text-color4 text-sm font-medium">TGG Price: ${tggPrice.toFixed(2)}</p>
          <p className="text-color4 text-sm font-medium">Delivery time: 0 - 2 Days</p>
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={() => setShowBuyNext(true)}
          className="w-full bg-color4 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transform transition-all duration-200 hover:bg-opacity-80 hover:scale-[1.02] active:scale-[0.98]"
        >
          Buy
        </button>
      </div>
    </div>
  )
}

export default Buy
