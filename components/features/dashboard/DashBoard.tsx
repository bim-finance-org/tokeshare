'use client';

import React, { useState } from 'react';
import BuyModal from './BuyModal';
import SellModal from './SellModal';
import SnapshotModal from './SnapshotModal';

const DashBoard = () => {
  const [isBuyOpen, setIsBuyOpen] = useState(true);
  const [isSellOpen, setIsSellOpen] = useState(false);
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);

  const handleBuy = () => {
    setIsBuyOpen(true);
    setIsSellOpen(false);
    setIsSnapshotOpen(false);
  };

  const handleSell = () => {
    setIsBuyOpen(false);
    setIsSellOpen(true);
    setIsSnapshotOpen(false);
  };

  const handleSnapshot = () => {
    setIsBuyOpen(false);
    setIsSellOpen(false);
    setIsSnapshotOpen(true);
  };

  return (
    <div>
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl text-black font-bold pt-4">Dashboard</h1>
        <div className="flex gap-4 pb-4">
          <button
            onClick={handleBuy}
            className={`bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 ${isBuyOpen ? 'bg-blue-700' : ''}`}
          >
            Buy
          </button>
          <button
            onClick={handleSell}
            className={`bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 ${isSellOpen ? 'bg-blue-700' : ''}`}
          >
            Sell
          </button>
          <button
            onClick={handleSnapshot}
            className={`bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 ${isSellOpen ? 'bg-blue-700' : ''}`}
          >
            Snapshot
          </button>
        </div>
      </div>
      {isBuyOpen && <BuyModal />}
      {isSellOpen && <SellModal />}
      {isSnapshotOpen && <SnapshotModal />}
    </div>
  );
};

export default DashBoard;
