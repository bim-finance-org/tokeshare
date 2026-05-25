import React from 'react';

interface ContractsProps {
  polygonContract?: string;
  baseContract?: string;
  ethereumContract?: string;
}

const linkClass =
  'w-20 flex items-center justify-center px-6 py-2 bg-color2 text-color1 rounded hover:scale-105 transition';

const Contracts = ({ polygonContract, baseContract, ethereumContract }: ContractsProps) => {
  return (
    <div className="flex items-center gap-4">
      <h1 className="text-xl text-color4 font-medium">VIEW SMART CONTRACTS</h1>
      <div className="flex gap-2">
        {polygonContract && (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`https://polygonscan.com/address/${polygonContract}`}
            className={linkClass}
          >
            POL
          </a>
        )}
        {baseContract && (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`https://basescan.org/address/${baseContract}`}
            className={linkClass}
          >
            BASE
          </a>
        )}
        {ethereumContract && (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`https://etherscan.io/address/${ethereumContract}`}
            className={linkClass}
          >
            ETH
          </a>
        )}
      </div>
    </div>
  );
};

export default Contracts;
