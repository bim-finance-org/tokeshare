'use client'

import React, { useState, useEffect, useContext } from 'react'
import TradeWidget from '../../../components/shared/TradeWidget'
import BankIcon from '@/components/icons/BankIcon'
import Blockchains from '@/components/Blockchains'
import { calculateTGGPrice, convertTGGToFiat } from '@/utils/priceUtils'
import ConnectButton from '@/components/shared/ConnectButton'
import { useAccount } from 'wagmi'
import UserForm from './UserForm'
import { TokenContexts } from '@/context/TokenContexts'
import { usePaxgPrice } from '@/hooks/usePaxgPrice'
import { useExchangeRates } from '@/hooks/useExchangeRates'
import { useTGGBalance } from '@/hooks/useTGGBalance'
import { Address } from 'viem'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const Sell = () => {
  const { 
    sell: { token: selectedCurrency, blockchain: selectedBlockchain },
    updateSellToken: setSelectedCurrency,
    updateSellBlockchain: setSelectedBlockchain
  } = useContext(TokenContexts);

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)
  const [amountToSell, setAmountToSell] = useState('10')
  const [receiveAmount, setReceiveAmount] = useState('0')
  const [tggPrice, setTggPrice] = useState<number>(0)
  const [showUserForm, setShowUserForm] = useState(false)
  const [showBalanceError, setShowBalanceError] = useState(false)
  const { isConnected, address } = useAccount()
  const { data: paxgPrice, isLoading: isPaxgLoading } = usePaxgPrice();
  const { data: exchangeRates, isLoading: isRatesLoading } = useExchangeRates();
  
  const { 
    formattedBalance, 
    checkSufficientBalance, 
    isLoading: isLoadingBalance 
  } = useTGGBalance(address as Address);
    
  useEffect(() => {
    const updatePrice = async () => {
      const calculatedTggPrice = calculateTGGPrice(paxgPrice);
      setTggPrice(calculatedTggPrice);
    };
    updatePrice();
    const interval = setInterval(updatePrice, 5000);
    return () => clearInterval(interval);
  }, [paxgPrice]);
  
  useEffect(() => {
    if (tggPrice > 0 && !isRatesLoading) {
      calculateReceiveAmount();
    }
  }, [tggPrice, exchangeRates, selectedCurrency, amountToSell]);

  useEffect(() => {
    setShowBalanceError(false);
  }, [amountToSell]);

  const calculateReceiveAmount = () => {
    const tggAmount = parseFloat(amountToSell) || 0;
    const fiatValue = convertTGGToFiat(tggAmount, selectedCurrency, exchangeRates, tggPrice);
    
    if (fiatValue !== undefined) {
      setReceiveAmount(fiatValue.toFixed(2));
    } else {
      setReceiveAmount('0');
    }
  };
  
  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    calculateReceiveAmount();
  };
  
  const handleTggAmountChange = (amount: string) => {
    if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
      setAmountToSell(amount);
    }
  };

  const handleSellClick = () => {
    if (!isConnected) {
      return;
    }

    const balanceCheck = checkSufficientBalance(amountToSell);
    
    if (!balanceCheck.hasSufficient || parseFloat(amountToSell) <= 0) {
      setShowBalanceError(true);
      return;
    }

    setShowUserForm(true);
  };

  const balanceCheck = checkSufficientBalance(amountToSell);

  if (showUserForm) {
    return (
      <div className="p-6 w-full text-color4 max-w-md mx-auto bg-gray-100 rounded-2xl shadow-md space-y-4">
        <div className="bg-gray-200 p-4 rounded-xl">
          <h1 className="text-xl font-bold mb-2">Reception address</h1>
          <p className="text-gray-600">Network: {selectedBlockchain}</p>
        </div>
        <UserForm 
          type="sell"
          amount={receiveAmount}
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
        onValueChange={handleTggAmountChange}
        onTokenChange={() => {}}
        type="crypto"
        value={amountToSell}
        blockchain={selectedBlockchain}
        showBalance={true}
      />

      <div className="my-4" />

      <TradeWidget
        label="YOU RECEIVE"
        defaultToken={selectedCurrency}
        onValueChange={() => {}}
        onTokenChange={handleCurrencyChange}
        type="fiat"
        value={receiveAmount}
        blockchain={selectedBlockchain}
      />

      <div className="mb-6 mt-4 space-y-2">
        <Blockchains section="sell" />
        <div className="space-y-1 ml-2">
          <p className="text-color4 text-sm font-medium">TGG Price: ${tggPrice.toFixed(2)}</p>
          <p className="text-color4 text-sm font-medium">Delivery time: 0 - 2 Days</p>
          {isConnected && (
            <p className="text-color4 text-sm font-medium">
              Your TGG Balance: {isLoadingBalance ? 'Loading...' : formattedBalance}
            </p>
          )}
        </div>
      </div>

      {showBalanceError && isConnected && !balanceCheck.hasSufficient && parseFloat(amountToSell) > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Insufficient TGG Balance</AlertTitle>
          <AlertDescription>
            You need {balanceCheck.formattedRequired} TGG but only have {balanceCheck.formattedBalance} TGG in your wallet.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-6">
        {isConnected ? (
          <button
            onClick={handleSellClick}
            className="w-full bg-color4 text-white py-3 rounded-xl font-medium shadow-sm hover:bg-opacity-90 transition-all duration-200"
          >
            Sell
          </button>
        ) : (
          <ConnectButton/>
        )}
      </div>
    </div>
  )
}

export default Sell