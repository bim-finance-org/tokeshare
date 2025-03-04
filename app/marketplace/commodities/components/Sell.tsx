import React, { useState, useEffect } from 'react'
import CurrencyInput from '../../../components/shared/CurrencyInput'
import BankIcon from '@/app/components/icons/BankIcon'
import Blockchains from '@/app/components/Blockchains'
import { fetchPAXGPrice, calculateTGGPrice } from '@/app/utils/priceUtils'

const Sell = () => {
  const [selectedCurrency, setSelectedCurrency] = useState(() =>
    localStorage.getItem('sellSelectedCurrency') || 'EUR'
  )
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)
  const [amountToSell, setAmountToSell] = useState('10')
  const [tggPrice, setTggPrice] = useState<number>(0)

  useEffect(() => {
    localStorage.setItem('sellSelectedCurrency', selectedCurrency)
  }, [selectedCurrency])

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

  return (
    <div className="p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 w-full">
      <div className="w-full bg-blue-600 text-white py-3 rounded-xl mb-6 flex items-center justify-center gap-3 shadow-md">
        <BankIcon />
        <span className="font-medium">Bank transfer</span>
      </div>

      <CurrencyInput
        label="YOU SEND"
        value={amountToSell}
        currency="TGG"
        isSelectable={false}
        disabled={false}
        onChangeValue={setAmountToSell}
      />

      <div className="my-4" />

      <CurrencyInput
        label="YOU RECEIVE"
        value={handleReceiveAmount()}
        currency={selectedCurrency}
        onCurrencySelect={setSelectedCurrency}
        isSelectable={true}
        disabled={false}
      />

      <div className="mb-6 mt-4 space-y-2">
        <Blockchains section="sell" />
        <div className="space-y-1 ml-2">
          <p className="text-color4 text-sm font-medium">TGG Price: ${tggPrice.toFixed(2)}</p>
          <p className="text-color4 text-sm font-medium">Delivery time: 0 - 2 Days</p>
        </div>
      </div>

      <div className="mt-6">
        <button className="w-full bg-color4 text-white py-3 rounded-xl font-medium shadow-md hover:shadow-lg transform transition-all duration-200 hover:bg-opacity-80 hover:scale-[1.02] active:scale-[0.98]">
          Sell
        </button>
      </div>
    </div>
  )
}

export default Sell