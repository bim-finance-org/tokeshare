import React, { useState, useEffect } from "react";
import TradeWidget from "@/app/components/shared/TradeWidget";
import Image from "next/image";
import Blockchains from "@/app/components/Blockchains";
import { fetchPAXGPrice, calculateTGGPrice } from "@/app/utils/priceUtils";
import { useAccount } from 'wagmi';
import ConnectButton from "@/app/components/shared/ConnectButton";
import UserForm from "./UserForm";

const Swap = () => {
  const [selectedBlockchain, setSelectedBlockchain] = useState(() =>
    localStorage.getItem("swapSelectedBlockchain") || "Polygon"
  );
  const [stablecoin, setStablecoin] = useState(() =>
    localStorage.getItem("swapReceiveCurrency") || "USDT"
  );
  const [stablecoinAmount, setStablecoinAmount] = useState("10");
  const [tggAmount, setTggAmount] = useState("0");
  const [tggPrice, setTggPrice] = useState<number>(0);
  const { isConnected } = useAccount();

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

  // Nouveau useEffect pour calculer le montant TGG initial
  useEffect(() => {
    if (tggPrice > 0) {
      const numericAmount = parseFloat(stablecoinAmount) || 0;
      const calculatedTggAmount = (numericAmount / tggPrice).toFixed(4);
      setTggAmount(calculatedTggAmount);
    }
  }, [tggPrice]); // Se déclenche quand le prix TGG est chargé

  const handleStablecoinAmountChange = (amount: string) => {
    // Autoriser une chaîne vide ou des nombres
    if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
      setStablecoinAmount(amount);
      if (tggPrice > 0) {
        const numericAmount = parseFloat(amount) || 0;
        const calculatedTggAmount = (numericAmount / tggPrice).toFixed(4);
        setTggAmount(calculatedTggAmount);
      }
    }
  };

  const handleBlockchainSelect = (blockchain: string) => {
    setSelectedBlockchain(blockchain);
    setStablecoin(blockchain === "Polygon" ? "USDT" : "USDC");
  };

  return (
    <div className="p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 w-full relative">
      <div className="flex flex-col gap-6 relative">
        <TradeWidget
          type="stablecoin"
          label="YOU SEND"
          defaultToken={stablecoin}
          value={stablecoinAmount}
          onValueChange={handleStablecoinAmountChange}
          onTokenChange={setStablecoin}
          blockchain={selectedBlockchain}
        />

        <div className="z-10 pt-2 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <button className="hover:scale-110 active:scale-95 transition-transform duration-200">
            <Image src="/images/switch.png" alt="Swap" width={60} height={60} />
          </button>
        </div>

        <TradeWidget
          label="YOU RECEIVE"
          defaultToken="TGG"
          value={tggAmount}
          onValueChange={() => {}}
          onTokenChange={() => {}}
          type="stablecoin"
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
