'use client';

import React, { useState, useMemo } from 'react';
import TradeWidget from '../../../components/shared/TradeWidget';
import BankIcon from '@/components/icons/BankIcon';
import Blockchains from '@/components/shared/Blockchains';
import {
  calculateTGGPrice,
  calculateTSGPrice,
  calculateTMCPrice,
  calculateTSP500Price,
  convertTGGToFiat,
} from '@/utils/priceUtils';
import ConnectButton from '@/components/shared/ConnectButton';
import { useAccount } from 'wagmi';
import UserForm from './UserForm';
import { useTokenContext } from '@/context/TokenContexts';
import { usePaxgPrice } from '@/hooks/usePaxgPrice';
import { useXagmPrice } from '@/hooks/useXagmPrice';
import { useCmc20Price } from '@/hooks/useCmc20Price';
import { useDeSPXAPrice } from '@/hooks/useDeSPXAPrice';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useTGGBalance } from '@/hooks/useTGGBalance';
import { useTSGBalance } from '@/hooks/useTSGBalance';
import { useTFTBalance } from '@/hooks/useTFTBalance';
import { Address } from 'viem';
import { TFT_001_PRICE_USD, TFT_001_SELL_FEES_COEF } from '@/constants/constants';
import { Badge } from '@/components/ui/badge';
import { ExchangeSection } from '@/enums/ExchangeSection';
import { TokenInfo } from '@/config/token';

const Sell = ({ token }: { token: TokenInfo }) => {
  const {
    sell: { token: selectedCurrency, blockchain: selectedBlockchain },
    updateSellToken: setSelectedCurrency,
    updateSellBlockchain: setSelectedBlockchain,
  } = useTokenContext();

  const [amountToSell, setAmountToSell] = useState('1');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showBalanceError, setShowBalanceError] = useState(false);
  const [isBelowMin, setBelownMin] = useState(false);
  const { isConnected, address } = useAccount();
  // Only the active token's price feed hits the network — the others stay idle.
  const { data: paxgPrice } = usePaxgPrice({ enabled: token.symbol === 'TGG' });
  const { data: xagmPrice } = useXagmPrice({ enabled: token.symbol === 'TSG' });
  const { data: cmc20Price } = useCmc20Price({ enabled: token.symbol === 'TMC' });
  const { data: despxaPrice } = useDeSPXAPrice({ enabled: token.symbol === 'TSP500' });
  const { data: exchangeRates, isLoading: isRatesLoading } = useExchangeRates();

  const isTFT = token.symbol === 'TFT_001';
  const isTSG = token.symbol === 'TSG';

  const { formattedBalance: tggFormattedBalance, checkSufficientBalance: tggCheckBalance, isLoading: isLoadingTGGBalance } =
    useTGGBalance(address as Address, selectedBlockchain);
  const { formattedBalance: tsgFormattedBalance, checkSufficientBalance: tsgCheckBalance, isLoading: isLoadingTSGBalance } =
    useTSGBalance(address as Address, selectedBlockchain);
  const { formattedBalance: tftFormattedBalance, checkSufficientBalance: tftCheckBalance, isLoading: isLoadingTFTBalance } =
    useTFTBalance(address as Address);

  const formattedBalance = isTFT ? tftFormattedBalance : isTSG ? tsgFormattedBalance : tggFormattedBalance;
  const checkSufficientBalance = isTFT ? tftCheckBalance : isTSG ? tsgCheckBalance : tggCheckBalance;

  // Derived: token price computed from upstream price feeds.
  // The upstream hooks already refetch on their own interval via TanStack
  // Query, so no local polling is needed.
  const tggPrice = useMemo<number>(() => {
    if (isTFT) return TFT_001_PRICE_USD;
    if (token.symbol === 'TGG' && paxgPrice) return calculateTGGPrice(paxgPrice);
    if (token.symbol === 'TSG' && xagmPrice) return calculateTSGPrice(xagmPrice);
    if (token.symbol === 'TMC' && cmc20Price) return calculateTMCPrice(cmc20Price);
    if (token.symbol === 'TSP500' && despxaPrice) return calculateTSP500Price(despxaPrice);
    return 0;
  }, [isTFT, token.symbol, paxgPrice, xagmPrice, cmc20Price, despxaPrice]);

  // Derived: fiat amount the user will receive, net of fees for TFT.
  const receiveAmount = useMemo(() => {
    if (tggPrice <= 0 || (!isTFT && isRatesLoading)) return '0';
    const tokenAmount = parseFloat(amountToSell) || 0;

    if (isTFT) {
      const grossValue = tokenAmount * TFT_001_PRICE_USD;
      const netValue = grossValue * (1 - TFT_001_SELL_FEES_COEF);
      if (selectedCurrency === 'USD') return netValue.toFixed(2);
      if (!exchangeRates) return '0';
      const fiatRate = exchangeRates[selectedCurrency as keyof typeof exchangeRates];
      return (netValue * fiatRate).toFixed(2);
    }

    const fiatValue = convertTGGToFiat(tokenAmount, selectedCurrency, exchangeRates, tggPrice);
    return fiatValue !== undefined ? fiatValue.toFixed(2) : '0';
  }, [amountToSell, tggPrice, exchangeRates, selectedCurrency, isTFT, isRatesLoading]);

  const isLoadingBalance = isTFT ? isLoadingTFTBalance : isTSG ? isLoadingTSGBalance : isLoadingTGGBalance;
  const hasInsufficientBalance =
    isConnected && !isLoadingBalance && !!amountToSell && parseFloat(amountToSell) > 0
      ? !checkSufficientBalance(amountToSell).hasSufficient
      : false;

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
  };

  const handleTggAmountChange = (amount: string) => {
    if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
      setAmountToSell(amount);
      setBelownMin(parseFloat(amount) < 0.5);
      // Clearing the balance error here (instead of via an effect on
      // amountToSell) avoids a setState-in-effect cascade.
      if (showBalanceError) setShowBalanceError(false);
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
          <button type="button"
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
