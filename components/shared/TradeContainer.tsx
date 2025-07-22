import React from 'react';

const TradeContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-color1 p-4 rounded-xl shadow-md">
      <div className="flex justify-between items-start gap-4">{children}</div>
    </div>
  );
};

export default TradeContainer;
