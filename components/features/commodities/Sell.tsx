'use client';

import React, { useState, useEffect, useContext } from 'react';
import TradeWidget from '../../../components/shared/TradeWidget';
import BankIcon from '@/components/icons/BankIcon';
import Blockchains from '@/components/shared/Blockchains';
import { calculateTGGPrice, calculateTMCPrice, calculateTSP500Price, convertTGGToFiat } from '@/utils/priceUtils';
import ConnectButton from '@/components/shared/ConnectButton';
import { useAccount } from 'wagmi';
import UserForm from './UserForm';
import { TokenContexts } from '@/context/TokenContexts';
import { usePaxgPrice } from '@/hooks/usePaxgPrice';
import { useCmc20Price } from '@/hooks/useCmc20Price';
import { useDeSPXAPrice } from '@/hooks/useDeSPXAPrice';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useTGGBalance } from '@/hooks/useTGGBalance';
import { useTFTBalance } from '@/hooks/useTFTBalance';
import { Address } from 'viem';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { INTERVAL_PRICE_UPDATE, TFT_001_PRICE_USD, TFT_001_SELL_FEES_COEF, FEES_COEF } from '@/constants/constants';
import { Badge } from '@/components/ui/badge';
import { ExchangeSection } from '@/enums/ExchangeSection';
import { TokenInfo } from '@/config/token';

const Sell = ({ token }: { token: TokenInfo }) => {
  const {
    sell: { token: selectedCurrency, blockchain: selectedBlockchain },
    updateSellToken: setSelectedCurrency,
    updateSellBlockchain: setSelectedBlockchain,
  } = useContext(TokenContexts);

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [amountToSell, setAmountToSell] = useState('1');
  const [receiveAmount, setReceiveAmount] = useState('0');
  const [tggPrice, setTggPrice] = useState<number>(0);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showBalanceError, setShowBalanceError] = useState(false);
  const [isBelowMin, setBelownMin] = useState(false);
  const { isConnected, address } = useAccount();
  const { data: paxgPrice, isLoading: isPaxgLoading } = usePaxgPrice();
  const { data: cmc20Price, isLoading: isCmc20Loading } = useCmc20Price();
  const { data: despxaPrice } = useDeSPXAPrice();
  const { data: exchangeRates, isLoading: isRatesLoading } = useExchangeRates();

  const isTFT = token.symbol === 'TFT_001';

  const { formattedBalance: tggFormattedBalance, checkSufficientBalance: tggCheckBalance, isLoading: isLoadingTGGBalance } =
    useTGGBalance(address as Address, selectedBlockchain);
  const { formattedBalance: tftFormattedBalance, checkSufficientBalance: tftCheckBalance, isLoading: isLoadingTFTBalance } =
    useTFTBalance(address as Address);

  const formattedBalance = isTFT ? tftFormattedBalance : tggFormattedBalance;
  const checkSufficientBalance = isTFT ? tftCheckBalance : tggCheckBalance;

  useEffect(() => {
    if (isTFT) {
      setTggPrice(TFT_001_PRICE_USD);
      return;
    }

    const updatePrice = async () => {
      if (token.symbol === 'TGG') {
        const calculatedPrice = calculateTGGPrice(paxgPrice);
        setTggPrice(calculatedPrice);
      } else if (token.symbol === 'TMC' && cmc20Price) {
        const calculatedPrice = calculateTMCPrice(cmc20Price);
        setTggPrice(calculatedPrice);
      } else if (token.symbol === 'TSP500' && despxaPrice) {
        const calculatedPrice = calculateTSP500Price(despxaPrice);
        setTggPrice(calculatedPrice);
      }
    };
    updatePrice();
    const interval = setInterval(updatePrice, INTERVAL_PRICE_UPDATE);
    return () => clearInterval(interval);
  }, [paxgPrice, cmc20Price, despxaPrice, token.symbol, isTFT]);

  useEffect(() => {
    setShowBalanceError(false);
  }, [amountToSell]);

  const isLoadingBalance = isTFT ? isLoadingTFTBalance : isLoadingTGGBalance;
  const hasInsufficientBalance =
    isConnected && !isLoadingBalance && !!amountToSell && parseFloat(amountToSell) > 0
      ? !checkSufficientBalance(amountToSell).hasSufficient
      : false;

  const calculateReceiveAmount = () => {
    const tokenAmount = parseFloat(amountToSell) || 0;

    if (isTFT) {
      const grossValue = tokenAmount * TFT_001_PRICE_USD;
      const netValue = grossValue * (1 - TFT_001_SELL_FEES_COEF);
      if (selectedCurrency === 'USD') {
        setReceiveAmount(netValue.toFixed(2));
      } else if (exchangeRates) {
        const fiatRate = exchangeRates[selectedCurrency as keyof typeof exchangeRates];
        setReceiveAmount((netValue * fiatRate).toFixed(2));
      }
      return;
    }

    const fiatValue = convertTGGToFiat(tokenAmount, selectedCurrency, exchangeRates, tggPrice);
    if (fiatValue !== undefined) {
      setReceiveAmount(fiatValue.toFixed(2));
    } else {
      setReceiveAmount('0');
    }
  };

  // Déclaré après calculateReceiveAmount pour éviter la TDZ.
  useEffect(() => {
    if (tggPrice > 0 && (isTFT || !isRatesLoading)) {
      calculateReceiveAmount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tggPrice, exchangeRates, selectedCurrency, amountToSell]);

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    calculateReceiveAmount();
  };

  const handleTggAmountChange = (amount: string) => {
    if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
      setAmountToSell(amount);
      if (parseFloat(amount) < 0.5) {
        setBelownMin(true);
      } else {
        setBelownMin(false);
      }
    }
  };

  const handleSellClick = (val: boolean) => {
    if (!isConnected) return;
    if (hasInsufficientBalance) {
      setShowBalanceError(true);
      return;
    }
    setShowUserForm(val);
  };

  if (showUserForm) {
    return (
      <div className="w-full text-color4 max-w-md mx-auto rounded-2xl ">
        <UserForm
          type="sell"
          amount={receiveAmount}
          currency={selectedCurrency}
          crypto={token.symbol}
          tggAmount={amountToSell}
          tggPrice={tggPrice}
          setShowUserForm={(val: boolean) => handleSellClick(val)}
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
        defaultToken={token.symbol}
        onValueChange={handleTggAmountChange}
        onTokenChange={() => {}}
        type="crypto"
        value={amountToSell}
        blockchain={selectedBlockchain}
        showBalance={true}
      />

      {isBelowMin && <div className="text-red-500 text-xs mt-2">Minimum amount is 0.5 {token.symbol}</div>}
      {showBalanceError && <div className="text-red-500 text-xs mt-2">Insufficient balance</div>}

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
        <Blockchains section={ExchangeSection.Sell} tokenSymbol={token.symbol} />
        <div className="bg-color1 rounded-lg p-3 space-y-2 ">
          <div className="flex items-center justify-between">
            <span className="text-color4 text-xs sm:text-sm font-medium">Delivery time:</span>
            <Badge className="text-xs sm:text-sm font-medium w-20 justify-center">2-4 Days</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-color4 text-xs sm:text-sm font-medium">{token.symbol} Price:</span>
            <Badge className="text-xs sm:text-sm font-medium w-20 justify-center">
              ${isTFT ? TFT_001_PRICE_USD.toFixed(2) : tggPrice.toFixed(2)}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-color4 text-xs sm:text-sm font-medium">Fees:</span>
            <Badge className="text-xs sm:text-sm font-medium w-20 justify-center">
              {isTFT ? '5%' : '2.5%'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {isConnected ? (
          <button
            onClick={() => handleSellClick(true)}
            className={`w-full py-3 rounded-xl font-medium shadow-sm transition-all duration-200
    ${isBelowMin || hasInsufficientBalance ? 'bg-color4 text-white opacity-50 cursor-not-allowed' : 'bg-color4 text-white hover:bg-opacity-90'}`}
            disabled={isBelowMin || hasInsufficientBalance}
          >
            Sell
          </button>
        ) : (
          <ConnectButton />
        )}
      </div>
    </div>
  );
};

export default Sell;
