import React from 'react';
import { useAccount } from 'wagmi';
import { useTokenBalance } from '@/utils/blockchainUtils';
import { Blockchain } from '@/types/Blockchain';

interface MaxButtonProps {
  currency: string;
  blockchain: Blockchain;
  onMaxClick: (maxValue: string) => void;
  className?: string;
}

const MaxButton = ({ currency, blockchain, onMaxClick, className = '' }: MaxButtonProps) => {
  const { isConnected } = useAccount();
  const balance = useTokenBalance(currency, blockchain);

  const handleMaxClick = () => {
    if (isConnected && balance && balance !== '0') {
      // Formater la balance avec max 6 décimales
      const numBalance = parseFloat(balance);
      if (!isNaN(numBalance)) {
        const formattedBalance = numBalance.toFixed(6).replace(/\.?0+$/, ''); // Supprime les zéros inutiles
        onMaxClick(formattedBalance);
      }
    }
  };

  const isDisabled = !isConnected || !balance || balance === '0' || parseFloat(balance) === 0;

  return (
    <button
      onClick={handleMaxClick}
      disabled={isDisabled}
      className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
        isDisabled
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-color4 text-white hover:bg-opacity-90 active:scale-95'
      } ${className}`}
    >
      MAX
    </button>
  );
};

export default MaxButton;
