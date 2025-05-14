import React, { useState, useEffect, useContext } from "react";
import TradeWidget from "@/components/shared/TradeWidget";
import Image from "next/image";
import Blockchains from "@/components/Blockchains";
import { calculateTGGPrice, convertStablecoinToTGG, convertTGGToStablecoin } from "@/utils/priceUtils";
import { useAccount } from 'wagmi';
import ConnectButton from "@/components/shared/ConnectButton";
import { TokenContexts } from '@/context/TokenContexts';
import { usePaxgPrice } from '@/hooks/usePaxgPrice';
import { useStablecoinPrice } from '@/hooks/useStablePrice';
import { StablecoinSymbol } from '@/utils/ListStableCoinsUsed';

// Définir le type pour les propriétés acceptées par TradeWidget
type TradeWidgetType = "stablecoin" | "crypto" | "fiat";

const Swap = () => {
  // Utiliser le context au lieu de useState + localStorage
  const { 
    swap: { token: stablecoin, blockchain: selectedBlockchain },
    updateSwapToken: setStablecoin,
    updateSwapBlockchain: setSelectedBlockchain
  } = useContext(TokenContexts);
  
  // État local qui reste inchangé
  const [stablecoinAmount, setStablecoinAmount] = useState("10");
  const [tggAmount, setTggAmount] = useState("0");
  const [tggPrice, setTggPrice] = useState<number>(0);
  const [isTggFirst, setIsTggFirst] = useState(false);
  const { isConnected } = useAccount();
  
  // Récupérer les prix via les hooks
  const { data: paxgPrice, isLoading } = usePaxgPrice();
  const { data: stablecoinPrice, isLoading: isLoadingStablecoin } = useStablecoinPrice({
    stablecoin: stablecoin as StablecoinSymbol
  });

  // Mise à jour du prix TGG quand paxgPrice change
  useEffect(() => {
    if (paxgPrice !== undefined) {
      const calculatedTggPrice = calculateTGGPrice(paxgPrice);
      setTggPrice(calculatedTggPrice);
      console.log("TGG price updated:", calculatedTggPrice, "from PAXG:", paxgPrice);
    }
  }, [paxgPrice]);

  // Fonction pour recalculer les montants en fonction de l'input actif
  const recalculateAmounts = () => {
    // Vérifier que les prix nécessaires sont disponibles
    if (tggPrice <= 0 || stablecoinPrice === undefined) return;
    
    const stablecoinRate = stablecoinPrice ?? 1.0;
    
    if (!isTggFirst) {
      // Si stablecoin est l'entrée, calcule le montant TGG
      const numericAmount = parseFloat(stablecoinAmount) || 0;
      const calculatedTggAmount = convertStablecoinToTGG(
        numericAmount, 
        stablecoinRate,
        tggPrice
      );
      setTggAmount(calculatedTggAmount.toFixed(4));
    } else {
      // Si TGG est l'entrée, calcule le montant stablecoin
      const numericAmount = parseFloat(tggAmount) || 0;
      const calculatedStablecoinAmount = convertTGGToStablecoin(
        numericAmount,
        tggPrice,
        stablecoinRate
      );
      setStablecoinAmount(calculatedStablecoinAmount.toFixed(2));
    }
  };

  // Effet pour recalculer quand les prix ou le stablecoin changent
  useEffect(() => {
    recalculateAmounts();
  }, [tggPrice, stablecoinPrice, stablecoin, isTggFirst]);

  // Effet pour recalculer quand les montants changent
  useEffect(() => {
    if (!isTggFirst) {
      recalculateAmounts();
    }
  }, [stablecoinAmount]);

  useEffect(() => {
    if (isTggFirst) {
      recalculateAmounts();
    }
  }, [tggAmount]);

  // Handle stablecoin amount change
  const handleStablecoinAmountChange = (amount: string) => {
    if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
      setStablecoinAmount(amount);
    }
  };

  // Handle TGG amount change
  const handleTggAmountChange = (amount: string) => {
    if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
      setTggAmount(amount);
    }
  };

  // Handle token selection change
  const handleTokenChange = (token: string) => {
    setStablecoin(token);
  };

  // Handle blockchain selection
  const handleBlockchainSelect = (blockchain: string) => {
    setSelectedBlockchain(blockchain);
    setStablecoin(blockchain === "Polygon" ? "USDT" : "USDC");
  };

  // Handle swap button click
  const handleSwap = () => {
    setIsTggFirst(!isTggFirst);
  };

  // Préparation des informations d'échange
  const exchangeRateInfo = () => {
    if (isLoading || isLoadingStablecoin) return "Loading...";
    
    const stablecoinRate = stablecoinPrice ?? 1.0;
    
    // Afficher le taux de change avec le stablecoin approprié
    if (stablecoinRate !== 1.0) {
      const adjustedPrice = tggPrice / stablecoinRate;
      return `1 TGG = ${adjustedPrice.toFixed(2)} ${stablecoin}`;
    }
    
    return `1 TGG = ${tggPrice.toFixed(2)} ${stablecoin}`;
  };

  // Debugging
  useEffect(() => {
    console.log("Stablecoin changed to:", stablecoin, "Rate:", stablecoinPrice);
  }, [stablecoin, stablecoinPrice]);

  // Déterminer quel widget est en entrée (modifiable) et lequel est en sortie (lecture seule)
  const topWidgetProps = {
    type: (isTggFirst ? "crypto" : "stablecoin") as TradeWidgetType,
    label: "YOU SEND",
    defaultToken: isTggFirst ? "TGG" : stablecoin,
    value: isTggFirst ? tggAmount : stablecoinAmount,
    onValueChange: isTggFirst ? handleTggAmountChange : handleStablecoinAmountChange,
    onTokenChange: handleTokenChange,
    blockchain: selectedBlockchain,
    showBalance: true,
    readOnly: false // Toujours modifiable (input du haut)
  };

  const bottomWidgetProps = {
    type: (isTggFirst ? "stablecoin" : "crypto") as TradeWidgetType,
    label: "YOU RECEIVE",
    defaultToken: isTggFirst ? stablecoin : "TGG",
    value: isTggFirst ? stablecoinAmount : tggAmount,
    onValueChange: () => {}, // Fonction vide car en lecture seule
    onTokenChange: handleTokenChange,
    blockchain: selectedBlockchain,
    showBalance: true,
    readOnly: true // Toujours en lecture seule (input du bas)
  };

  // Vérifier si les prix sont disponibles pour permettre l'affichage
  const arePricesAvailable = tggPrice > 0 && stablecoinPrice !== undefined;
  const errorMessage = !arePricesAvailable ? 
    (isLoading || isLoadingStablecoin ? "Chargement des prix..." : "Prix non disponibles pour cette conversion") : "";

  return (
    <div className="p-3 sm:p-6 w-full relative">
      <div className="flex flex-col gap-4 sm:gap-6 relative">
        <TradeWidget
          {...topWidgetProps}
        />

        <div className="z-10 pt-2 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <button 
            onClick={handleSwap}
            className="hover:scale-110 active:scale-95 transition-transform duration-200"
          >
            <Image src="/images/switch.png" alt="Swap" width={60} height={60} />
          </button>
        </div>

        <TradeWidget
          {...bottomWidgetProps}
        />
        
        {errorMessage && (
          <div className="text-red-500 text-center text-sm font-medium mt-1">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="mb-4 sm:mb-6 mt-3 sm:mt-4 space-y-1 sm:space-y-2">
        <Blockchains section="swap" onSelect={handleBlockchainSelect} />
        <p className="text-color4 text-xs sm:text-sm font-medium ml-2">Delivery time: instant</p>
        <p className="text-color4 text-xs sm:text-sm font-medium ml-2">
          TGG Price: {isLoading ? "Loading..." : `$${tggPrice.toFixed(2)}`}
        </p>
        <p className="text-color4 text-xs sm:text-sm font-medium ml-2">
          Exchange rate: {exchangeRateInfo()}
        </p>
        {stablecoinPrice && (
          <p className="text-color4 text-xs sm:text-sm font-medium ml-2">
            {stablecoin} rate: ${stablecoinPrice.toFixed(4)}
          </p>
        )}
      </div>

      <div className="mt-4 sm:mt-6">
        {isConnected ? (
          <button 
            className={`w-full py-2 sm:py-3 rounded-xl font-medium shadow-sm transition-all duration-200 text-sm sm:text-base ${
              arePricesAvailable 
                ? "bg-color4 text-white hover:bg-opacity-90" 
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
            disabled={!arePricesAvailable}
          >
            Swap
          </button>
        ) : (
          <ConnectButton />
        )}
      </div>
    </div>
  );
};

export default Swap;

