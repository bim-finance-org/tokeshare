import React, { useState, useEffect } from "react";
import TradeWidget from "@/app/components/shared/TradeWidget";
import Image from "next/image";
import Blockchains from "@/app/components/Blockchains";
import { fetchPAXGPrice, calculateTGGPrice } from "@/app/utils/priceUtils";
import { useAccount } from 'wagmi';
import ConnectButton from "@/app/components/shared/ConnectButton";


const Swap = () => {


  const [selectedBlockchain, setSelectedBlockchain] = useState("Polygon");
  const [stablecoin, setStablecoin] = useState("USDT");
  const [stablecoinAmount, setStablecoinAmount] = useState("10");
  const [tggAmount, setTggAmount] = useState("0");
  const [tggPrice, setTggPrice] = useState<number>(0);
  const [isTggFirst, setIsTggFirst] = useState(false);
  const { isConnected } = useAccount();

  // Load saved preferences from localStorage on client-side only
  useEffect(() => {
    // Initialize from localStorage when component mounts (client-side only)
    const savedBlockchain = localStorage.getItem("swapSelectedBlockchain");
    if (savedBlockchain) {
      setSelectedBlockchain(savedBlockchain);
    }
    
    const savedStablecoin = localStorage.getItem("swapReceiveCurrency");
    if (savedStablecoin) {
      setStablecoin(savedStablecoin);
    }
  }, []);

  // Sauvegarde du stablecoin sélectionné
  useEffect(() => {
    localStorage.setItem("swapReceiveCurrency", stablecoin);
  }, [stablecoin]);

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
      if (!isTggFirst) {
        // If stablecoin is first, calculate TGG amount
        const numericAmount = parseFloat(stablecoinAmount) || 0;
        const calculatedTggAmount = (numericAmount / tggPrice).toFixed(4);
        setTggAmount(calculatedTggAmount);
      } else {
        // If TGG is first, calculate stablecoin amount
        const numericAmount = parseFloat(tggAmount) || 0;
        const calculatedStablecoinAmount = (numericAmount * tggPrice).toFixed(2);
        setStablecoinAmount(calculatedStablecoinAmount);
      }
    }
  }, [tggPrice, isTggFirst]);

  // Handle stablecoin amount change
  const handleStablecoinAmountChange = (amount: string) => {
    if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
      setStablecoinAmount(amount);
      if (tggPrice > 0) {
        const numericAmount = parseFloat(amount) || 0;
        const calculatedTggAmount = (numericAmount / tggPrice).toFixed(4);
        setTggAmount(calculatedTggAmount);
      }
    }
  };

  // Handle TGG amount change
  const handleTggAmountChange = (amount: string) => {
    if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
      setTggAmount(amount);
      if (tggPrice > 0) {
        const numericAmount = parseFloat(amount) || 0;
        const calculatedStablecoinAmount = (numericAmount * tggPrice).toFixed(2);
        setStablecoinAmount(calculatedStablecoinAmount);
      }
    }
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

  return (
    <div className="p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 w-full relative">
      <div className="flex flex-col gap-6 relative">
        <TradeWidget
          type={isTggFirst ? "crypto" : "stablecoin"}
          label="YOU SEND"
          defaultToken={isTggFirst ? "TGG" : stablecoin}
          value={isTggFirst ? tggAmount : stablecoinAmount}
          onValueChange={isTggFirst ? handleTggAmountChange : handleStablecoinAmountChange}
          onTokenChange={token => {
            if (!isTggFirst) setStablecoin(token);
          }}
          blockchain={selectedBlockchain}
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
          type={isTggFirst ? "stablecoin" : "crypto"}
          label="YOU RECEIVE"
          defaultToken={isTggFirst ? stablecoin : "TGG"}
          value={isTggFirst ? stablecoinAmount : tggAmount}
          onValueChange={isTggFirst ? handleStablecoinAmountChange : handleTggAmountChange}
          onTokenChange={token => {
            if (isTggFirst) setStablecoin(token);
          }}
          blockchain={selectedBlockchain}
        />
      </div>

      <div className="mb-6 mt-4 space-y-2">
        <Blockchains section="swap" onSelect={handleBlockchainSelect} />
        <p className="text-color4 text-sm font-medium ml-2">Delivery time: instant</p>
        <p className="text-color4 text-sm font-medium ml-2">TGG Price: ${tggPrice.toFixed(2)}</p>
        <p className="text-color4 text-sm font-medium ml-2">
          Exchange rate: 1 TGG = ${tggPrice.toFixed(2)}
        </p>
      </div>

      <div className="mt-6">
        {isConnected ? (
          <button className="w-full bg-color4 text-white py-3 rounded-xl font-medium shadow-sm hover:bg-opacity-90 transition-all duration-200">
            Swap
          </button>
        ) : (
          <ConnectButton
            connectText="Connect Wallet"
            connectedText="Swap"
          />
        )}
      </div>
    </div>
  );
};

export default Swap;
