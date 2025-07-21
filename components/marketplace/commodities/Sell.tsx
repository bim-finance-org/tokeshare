"use client";

import React, { useState, useEffect, useContext } from "react";
import TradeWidget from "../../../components/shared/TradeWidget";
import BankIcon from "@/components/icons/BankIcon";
import Blockchains from "@/components/Blockchains";
import { calculateTGGPrice, convertTGGToFiat } from "@/utils/priceUtils";
import ConnectButton from "@/components/shared/ConnectButton";
import { useAccount } from "wagmi";
import UserForm from "./UserForm";
import { TokenContexts } from "@/context/TokenContexts";
import { usePaxgPrice } from "@/hooks/usePaxgPrice";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useTGGBalance } from "@/hooks/useTGGBalance";
import { Address } from "viem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { INTERVAL_PRICE_UPDATE } from "@/constants/constants";
import { Badge } from "@/components/ui/badge";
import { ExchangeSection } from "@/types/ExchangeSection";

const Sell = () => {
  const {
    sell: { token: selectedCurrency, blockchain: selectedBlockchain },
    updateSellToken: setSelectedCurrency,
    updateSellBlockchain: setSelectedBlockchain,
  } = useContext(TokenContexts);

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [amountToSell, setAmountToSell] = useState("1");
  const [receiveAmount, setReceiveAmount] = useState("0");
  const [tggPrice, setTggPrice] = useState<number>(0);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showBalanceError, setShowBalanceError] = useState(false);
  const [isBelowMin, setBelownMin] = useState(false);
  const { isConnected, address } = useAccount();
  const { data: paxgPrice, isLoading: isPaxgLoading } = usePaxgPrice();
  const { data: exchangeRates, isLoading: isRatesLoading } = useExchangeRates();

  const {
    formattedBalance,
    checkSufficientBalance,
    isLoading: isLoadingBalance,
  } = useTGGBalance(address as Address);

  useEffect(() => {
    const updatePrice = async () => {
      const calculatedTggPrice = calculateTGGPrice(paxgPrice);
      setTggPrice(calculatedTggPrice);
    };
    updatePrice();
    const interval = setInterval(updatePrice, INTERVAL_PRICE_UPDATE);
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
    const fiatValue = convertTGGToFiat(
      tggAmount,
      selectedCurrency,
      exchangeRates,
      tggPrice
    );

    if (fiatValue !== undefined) {
      setReceiveAmount(fiatValue.toFixed(2));
    } else {
      setReceiveAmount("0");
    }
  };

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    calculateReceiveAmount();
  };

  const handleTggAmountChange = (amount: string) => {
    if (amount === "" || /^\d*\.?\d*$/.test(amount)) {
      setAmountToSell(amount);
      if (parseFloat(amount) < 0.5) {
        setBelownMin(true);
      } else {
        setBelownMin(false);
      }
    }
  };

  const handleSellClick = (val: boolean) => {
    if (!isConnected) {
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
        defaultToken="TGG"
        onValueChange={handleTggAmountChange}
        onTokenChange={() => {}}
        type="crypto"
        value={amountToSell}
        blockchain={selectedBlockchain}
        showBalance={true}
      />

      {isBelowMin && (
        <div className="text-red-500 text-xs mt-2">
          Minimum amount is 0.5 TGG
        </div>
      )}

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
        <Blockchains section={ExchangeSection.Sell} />
        <div className="bg-color1 rounded-lg p-3 space-y-2 ">
          <div className="flex items-center justify-between">
            <span className="text-color4 text-xs sm:text-sm font-medium">
              Delivery time:
            </span>
            <Badge className="text-xs sm:text-sm font-medium w-20 justify-center">
              2-4 Days
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-color4 text-xs sm:text-sm font-medium">
              TGG Price:
            </span>

            <Badge className="text-xs sm:text-sm font-medium w-20 justify-center">
              ${tggPrice.toFixed(2)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {isConnected ? (
          <button
            onClick={() => handleSellClick(true)}
            className={`w-full py-3 rounded-xl font-medium shadow-sm transition-all duration-200 
    ${
      isBelowMin
        ? "bg-color4 text-white opacity-50 cursor-not-allowed"
        : "bg-color4 text-white hover:bg-opacity-90"
    }`}
            disabled={isBelowMin}
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
