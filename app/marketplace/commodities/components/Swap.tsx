import React, { useState, useEffect } from "react";
import CurrencyInput from "@/app/components/shared/CurrencyInput";
import Image from "next/image";
import Blockchains from "@/app/components/Blockchains";
import { fetchPAXGPrice, calculateTGGPrice } from "@/app/utils/priceUtils";
import { useAccount } from 'wagmi';
import ConnectButton from "@/app/components/shared/ConnectButton";

const Swap = () => {
  const [isTggFirst, setIsTggFirst] = useState(true);
  const [selectedBlockchain, setSelectedBlockchain] = useState(() =>
    localStorage.getItem("swapSelectedBlockchain") || "Polygon"
  );
  const [receiveCurrency, setReceiveCurrency] = useState(() =>
    localStorage.getItem("swapReceiveCurrency") || "USDT"
  );
  const [amountToSend, setAmountToSend] = useState("10");
  const [amountToReceive, setAmountToReceive] = useState("9.2444");
  const [tggPrice, setTggPrice] = useState<number>(0);
  const { isConnected } = useAccount();

  useEffect(() => {
    localStorage.setItem("swapReceiveCurrency", receiveCurrency);
  }, [receiveCurrency]);

  useEffect(() => {
    const updatePrice = async () => {
      const paxgPrice = await fetchPAXGPrice();
      const calculatedTggPrice = calculateTGGPrice(paxgPrice);
      setTggPrice(calculatedTggPrice);
    };
    updatePrice();
    // Update price every 30 seconds
    const interval = setInterval(updatePrice, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSwapCurrencies = () => {
    setIsTggFirst(!isTggFirst);
    const tempAmount = amountToSend;
    setAmountToSend(amountToReceive);
    setAmountToReceive(tempAmount);
  };

  const handleBlockchainSelect = (blockchain: string) => {
    setSelectedBlockchain(blockchain);
    setReceiveCurrency(blockchain === "Polygon" ? "USDT" : "USDC");
  };

  const handleAmountChange = (value: string, isSending: boolean) => {
    if (isSending) {
      setAmountToSend(value);
      if (isTggFirst) {
        // If sending TGG, calculate receive amount based on TGG price
        const tggAmount = parseFloat(value) || 0;
        const receiveAmount = (tggAmount * tggPrice).toFixed(4);
        setAmountToReceive(receiveAmount);
      } else {
        // If sending stablecoin, calculate TGG amount
        const stablecoinAmount = parseFloat(value) || 0;
        const tggAmount = (stablecoinAmount / tggPrice).toFixed(4);
        setAmountToReceive(tggAmount);
      }
    } else {
      setAmountToReceive(value);
      if (isTggFirst) {
        // If receiving TGG, calculate send amount based on TGG price
        const tggAmount = parseFloat(value) || 0;
        const sendAmount = (tggAmount * tggPrice).toFixed(4);
        setAmountToSend(sendAmount);
      } else {
        // If receiving stablecoin, calculate TGG amount
        const stablecoinAmount = parseFloat(value) || 0;
        const tggAmount = (stablecoinAmount / tggPrice).toFixed(4);
        setAmountToSend(tggAmount);
      }
    }
  };

  return (
    <div className="p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 w-full relative">
      <div className="flex flex-col gap-6 relative">
        <CurrencyInput
          label="YOU SEND"
          value={amountToSend}
          currency={isTggFirst ? "TGG" : receiveCurrency}
          onChangeValue={(value) => handleAmountChange(value, true)}
          onCurrencySelect={!isTggFirst ? setReceiveCurrency : undefined}
          isSelectable={!isTggFirst}
          type="stablecoin"
          blockchain={selectedBlockchain}
        />

        <div className="z-10 pt-2 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <button 
            onClick={handleSwapCurrencies}
            className="hover:scale-110 active:scale-95 transition-transform duration-200"
          >
            <Image src="/images/switch.png" alt="Swap" width={60} height={60} />
          </button>
        </div>

        <CurrencyInput
          label="YOU RECEIVE"
          value={amountToReceive} 
          currency={isTggFirst ? receiveCurrency : "TGG"}
          onCurrencySelect={isTggFirst ? setReceiveCurrency : undefined}
          isSelectable={isTggFirst}
          type="stablecoin"
          blockchain={selectedBlockchain}
          disabled={false}
          onChangeValue={(value) => handleAmountChange(value, false)}
        />
      </div>

      <div className="mb-6 mt-4 space-y-2">
        <Blockchains section="swap" onSelect={handleBlockchainSelect} />
        <p className="text-color4 text-sm font-medium ml-2">Delivery time: instant</p>
        <p className="text-color4 text-sm font-medium ml-2">TGG Price: ${tggPrice.toFixed(2)}</p>
        <p className="text-color4 text-sm font-medium ml-2">Exchange rate: </p>
      </div>

      <div className="mt-6">
        <ConnectButton
          connectText="Connect Wallet"
          connectedText="Swap"
        />
      </div>
    </div>
  );
};

export default Swap;
