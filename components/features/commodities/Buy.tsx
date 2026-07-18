'use client';

import React, { useState, useEffect, useMemo } from 'react';
import TradeWidget from '@/components/shared/TradeWidget';
import BankIcon from '@/components/icons/BankIcon';
import Blockchains from '@/components/shared/Blockchains';
import {
  calculateTGGPrice,
  calculateTSGPrice,
  calculateTMCPrice,
  calculateTSP500Price,
  convertFiatToTGG,
  convertTGGToFiat,
} from '@/utils/priceUtils';
import { usePaxgPrice } from '@/hooks/usePaxgPrice';
import { useXagmPrice } from '@/hooks/useXagmPrice';
import { useCmc20Price } from '@/hooks/useCmc20Price';
import { useDeSPXAPrice } from '@/hooks/useDeSPXAPrice';
import { useAccount } from 'wagmi';
import UserForm from './UserForm';
import { useTokenContext } from '@/context/TokenContexts';
import { ExchangeRates, useExchangeRates } from '@/hooks/useExchangeRates';
import { Badge } from '@/components/ui/badge';
import { ExchangeSection } from '@/enums/ExchangeSection';
import { TokenInfo } from '@/config/token';

const TFT_001_PRICE_USD = 31.25;

const Buy = ({ token }: { token: TokenInfo }) => {
  // Get values from context
  const {
    buy: { token: selectedCurrency, blockchain: selectedBlockchain },
    updateBuyToken: setSelectedCurrency,
    updateBuyBlockchain: setSelectedBlockchain,
  } = useTokenContext();

  // Local state — fiat amount is the single source of truth.
  // The crypto amount is derived during render below.
  const [amountToSend, setAmountToSend] = useState('50');
  const [tggPrice, setTggPrice] = useState<number>(0);
  const [showBuyNext, setShowBuyNext] = useState(false);
  const [isBelowMin, setBelownMin] = useState(false);
  const { isConnected } = useAccount();
  // Only the active token's price feed hits the network — the others stay idle.
  const { data: paxgPrice } = usePaxgPrice({ enabled: token.symbol === 'TGG' });
  const { data: xagmPrice } = useXagmPrice({ enabled: token.symbol === 'TSG' });
  const { data: cmc20Price } = useCmc20Price({ enabled: token.symbol === 'TMC' });
  const { data: despxaPrice } = useDeSPXAPrice({ enabled: token.symbol === 'TSP500' });
  const { data: exchangeRates, isLoading: isRatesLoading } = useExchangeRates();

  // Mise à jour du prix du token
  useEffect(() => {
    const updatePrice = () => {
      if (token.symbol === 'TGG' && paxgPrice) {
        const calculatedPrice = calculateTGGPrice(paxgPrice);
        setTggPrice(calculatedPrice);
      } else if (token.symbol === 'TSG' && xagmPrice) {
        const calculatedPrice = calculateTSGPrice(xagmPrice);
        setTggPrice(calculatedPrice);
      } else if (token.symbol === 'TMC' && cmc20Price) {
        const calculatedPrice = calculateTMCPrice(cmc20Price);
        setTggPrice(calculatedPrice);
      } else if (token.symbol === 'TSP500' && despxaPrice) {
        const calculatedPrice = calculateTSP500Price(despxaPrice);
        setTggPrice(calculatedPrice);
      } else if (token.symbol === 'TFT_001') {
        setTggPrice(TFT_001_PRICE_USD);
      }
    };
    updatePrice();
    const interval = setInterval(updatePrice, 30000);
    return () => clearInterval(interval);
  }, [paxgPrice, xagmPrice, cmc20Price, despxaPrice, token.symbol]);

  // Derived: crypto amount computed during render from the fiat input.
  const tggAmount = useMemo(() => {
    if (tggPrice <= 0 || isRatesLoading) return '0';
    const numericAmount = parseFloat(amountToSend) || 0;

    if (
      token.symbol === 'TGG' ||
      token.symbol === 'TSG' ||
      token.symbol === 'TMC' ||
      token.symbol === 'TSP500'
    ) {
      const value = convertFiatToTGG(numericAmount, selectedCurrency, exchangeRates, tggPrice);
      return value !== undefined ? value.toFixed(4) : '0';
    }

    if (token.symbol === 'TFT_001') {
      if (selectedCurrency === 'USD') return (numericAmount / TFT_001_PRICE_USD).toFixed(4);
      if (!exchangeRates) return '0';
      const fiatRate = exchangeRates[selectedCurrency as keyof ExchangeRates];
      return (numericAmount / fiatRate / TFT_001_PRICE_USD).toFixed(4);
    }

    return '0';
  }, [amountToSend, tggPrice, exchangeRates, selectedCurrency, token.symbol, isRatesLoading]);

  // Gestion du changement de montant en devise fiat
  const handleFiatAmountChange = (amount: string) => {
    if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
      setAmountToSend(amount);
      setBelownMin(parseFloat(amount) < 50);
    }
  };

  // Gestion du changement de montant en TGG : on convertit en fiat (source de
  // vérité) ; la valeur affichée du champ crypto sera re-dérivée au prochain
  // render.
  const handleTggAmountChange = (amount: string) => {
    if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
      if (tggPrice <= 0) return;
      const numericAmount = parseFloat(amount) || 0;
      const fiatValue = convertTGGToFiat(numericAmount, selectedCurrency, exchangeRates, tggPrice);
      const newFiat = fiatValue !== undefined ? fiatValue.toFixed(2) : '0';
      setAmountToSend(newFiat);
      setBelownMin(parseFloat(newFiat) < 50);
    }
  };

  // Gestion du changement de devise
  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
  };

  const handleSellClick = (val: boolean) => {
    setShowBuyNext(val);
  };

  if (showBuyNext) {
    return (
      <UserForm
        type="buy"
        amount={amountToSend}
        currency={selectedCurrency}
        crypto={token.symbol}
        tggAmount={tggAmount}
        tggPrice={tggPrice}
        setShowUserForm={handleSellClick}
      />
    );
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
        onTokenChange={handleCurrencyChange}
      />

      {isBelowMin && <div className="text-red-500 text-xs mt-2">Minimum amount is 50 {selectedCurrency}</div>}

      <div className="my-4" />

      {/* Affichage du montant en TGG */}
      <TradeWidget
        label="YOU RECEIVE"
        defaultToken={token.symbol}
        value={tggAmount}
        onValueChange={handleTggAmountChange}
        onTokenChange={() => {}} // TGG ne peut pas être changé
        type="crypto"
      />

      <div className="mb-6 mt-4 space-y-2">
        <Blockchains section={ExchangeSection.Buy} tokenSymbol={token.symbol} />
        <div className="bg-color1 rounded-lg p-3 space-y-2 ">
          <div className="flex items-center justify-between">
            <span className="text-color4 text-xs sm:text-sm font-medium">Delivery time:</span>
            <Badge className="text-xs sm:text-sm font-medium w-20 justify-center">2-4 Days</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-color4 text-xs sm:text-sm font-medium">{token.symbol} Price:</span>

            <Badge className="text-xs sm:text-sm font-medium w-20 justify-center">
              ${token.symbol === 'TFT_001' ? '31.25' : tggPrice.toFixed(2)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {isConnected ? (
          <button type="button"
            onClick={() => handleSellClick(true)}
            className={`w-full py-3 rounded-xl font-medium shadow-sm transition-all duration-200 
    ${isBelowMin ? 'bg-color4 text-white opacity-50 cursor-not-allowed' : 'bg-color4 text-white hover:bg-opacity-90'}`}
            disabled={isBelowMin}
          >
            Buy
          </button>
        ) : (
          <button type="button"
            onClick={() => setShowBuyNext(true)}
            className="w-full bg-color4 text-white py-3 rounded-xl font-medium shadow-sm hover:bg-opacity-90 transition-all duration-200"
          >
            Buy
          </button>
        )}
      </div>
    </div>
  );
};

export default Buy;
