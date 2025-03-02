import React, { useState, useEffect } from "react";
import CurrencyInput from "@/app/components/shared/CurrencyInput";
import Image from "next/image";
import Blockchains from "@/app/components/Blockchains";

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

  useEffect(() => {
    localStorage.setItem("swapReceiveCurrency", receiveCurrency);
  }, [receiveCurrency]);

  const handleSwapCurrencies = () => {
    // Toggle TGG position
    setIsTggFirst(!isTggFirst);

    // Swap amounts
    const tempAmount = amountToSend;
    setAmountToSend(amountToReceive);
    setAmountToReceive(tempAmount);
  };

  const handleBlockchainSelect = (blockchain: string) => {
    setSelectedBlockchain(blockchain);
    // Reset to default stablecoin for the selected blockchain
    setReceiveCurrency(blockchain === "Polygon" ? "USDT" : "USDC");
  };

  return (
    <div className="p-6 bg-white rounded-3xl shadow-sm w-full relative">
      <div className="flex flex-col gap-6 relative">
        {/* First Input */}
        <CurrencyInput
          label="YOU SEND"
          value={amountToSend}
          currency={isTggFirst ? "TGG" : receiveCurrency}
          onChangeValue={setAmountToSend}
          onCurrencySelect={!isTggFirst ? setReceiveCurrency : undefined}
          isSelectable={!isTggFirst}
          type="stablecoin"
          blockchain={selectedBlockchain}
        />

        {/* Swap Button Between Inputs */}
        <div className="z-10 pt-2 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 ">
          <button onClick={handleSwapCurrencies}>
            <Image src="/images/switch.png" alt="Swap" width={60} height={60} />
          </button>
        </div>

        {/* Second Input */}
        <CurrencyInput
          label="YOU RECEIVE"
          value={amountToReceive} 
          currency={isTggFirst ? receiveCurrency : "TGG"}
          onCurrencySelect={isTggFirst ? setReceiveCurrency : undefined}
          isSelectable={isTggFirst}
          type="stablecoin"
          blockchain={selectedBlockchain}
        />
      </div>

      <div className="mb-6">
        <Blockchains section="swap" onSelect={handleBlockchainSelect} />
      </div>

      {/* Swap Button */}
      <div className="mt-6">
        <button className="w-full bg-color4 text-white py-3 rounded-xl font-medium">
          Swap
        </button>
      </div>
    </div>
  );
};

export default Swap;
