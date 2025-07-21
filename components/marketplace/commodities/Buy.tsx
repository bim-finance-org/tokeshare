"use client";

import React, { useState, useEffect, useContext } from "react";
import TradeWidget from "@/components/shared/TradeWidget";
import BankIcon from "@/components/icons/BankIcon";
import Blockchains from "@/components/Blockchains";
import {
  calculateTGGPrice,
  convertFiatToTGG,
  convertTGGToFiat,
} from "@/utils/priceUtils";
import { usePaxgPrice } from "@/hooks/usePaxgPrice";
import ConnectButton from "@/components/shared/ConnectButton";
import { useAccount } from "wagmi";
import UserForm from "./UserForm";
import { TokenContexts } from "@/context/TokenContexts";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { Badge } from "@/components/ui/badge";
import { ExchangeSection } from "@/types/ExchangeSection";

const Buy = () => {
  // Get values from context
  const {
    buy: { token: selectedCurrency, blockchain: selectedBlockchain },
    updateBuyToken: setSelectedCurrency,
    updateBuyBlockchain: setSelectedBlockchain,
  } = useContext(TokenContexts);

  // Local state
  const [amountToSend, setAmountToSend] = useState("50");
  const [tggAmount, setTggAmount] = useState("0");
  const [tggPrice, setTggPrice] = useState<number>(0);
  const [showBuyNext, setShowBuyNext] = useState(false);
  const [isBelowMin, setBelownMin] = useState(false);
  const { isConnected } = useAccount();
  const { data: paxgPrice, isLoading: isPaxgLoading } = usePaxgPrice();
  const { data: exchangeRates, isLoading: isRatesLoading } = useExchangeRates();

  // Mise à jour du prix TGG
  useEffect(() => {
    const updatePrice = async () => {
      const calculatedTggPrice = calculateTGGPrice(paxgPrice);
      setTggPrice(calculatedTggPrice);
    };
    updatePrice();
    const interval = setInterval(updatePrice, 30000);
    return () => clearInterval(interval);
  }, [paxgPrice]);

  // Calcul initial du montant TGG
  useEffect(() => {
    if (tggPrice > 0 && !isRatesLoading) {
      calculateTggFromFiat(amountToSend);
    }
  }, [tggPrice, exchangeRates, selectedCurrency]);

  // Calcule le montant TGG à partir du montant fiat
  const calculateTggFromFiat = (fiatAmount: string) => {
    if (tggPrice > 0) {
      const numericAmount = parseFloat(fiatAmount) || 0;
      const tggValue = convertFiatToTGG(
        numericAmount,
        selectedCurrency,
        exchangeRates,
        tggPrice
      );
      if (tggValue !== undefined) {
        setTggAmount(tggValue.toFixed(4));
      } else {
        setTggAmount("0");
      }
    }
  };

  // Calcule le montant fiat à partir du montant TGG
  const calculateFiatFromTgg = (tggValue: string) => {
    if (tggPrice > 0) {
      const numericAmount = parseFloat(tggValue) || 0;
      const fiatValue = convertTGGToFiat(
        numericAmount,
        selectedCurrency,
        exchangeRates,
        tggPrice
      );
      if (fiatValue !== undefined) {
        setAmountToSend(fiatValue.toFixed(2));
      } else {
        setAmountToSend("0");
      }
    }
  };

  // Gestion du changement de montant en devise fiat
  const handleFiatAmountChange = (amount: string) => {
    if (amount === "" || /^\d*\.?\d*$/.test(amount)) {
      setAmountToSend(amount);
      calculateTggFromFiat(amount);
      if (parseFloat(amount) < 50) {
        setBelownMin(true);
      } else {
        setBelownMin(false);
      }
    }
  };

  // Gestion du changement de montant en TGG
  const handleTggAmountChange = (amount: string) => {
    if (amount === "" || /^\d*\.?\d*$/.test(amount)) {
      setTggAmount(amount);
      calculateFiatFromTgg(amount);
    }
  };

  // Gestion du changement de devise
  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    // Recalculer le montant TGG avec la nouvelle devise
    if (amountToSend) {
      calculateTggFromFiat(amountToSend);
    }
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

      {isBelowMin && (
        <div className="text-red-500 text-xs mt-2">
          Minimum amount is 50 {selectedCurrency}
        </div>
      )}

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
        <Blockchains section={ExchangeSection.Buy} />
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
  );
};

export default Buy;
