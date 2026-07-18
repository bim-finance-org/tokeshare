import React from 'react';
import { useAccount } from 'wagmi';
import { useTokenBalance } from '@/utils/blockchainUtils';
import { Blockchain } from '@/enums/Blockchain';

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
    <button type="button"
      onClick={handleMaxClick}
      disabled={isDisabled}
      className={`px-2.5 py-1 text-[11px] font-semibold tracking-wide rounded-lg transition-all duration-200 ${
        isDisabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-color4 text-white hover:bg-color2 active:scale-95'
      } ${className}`}
    >
      MAX
    </button>
  );
};

export default MaxButton;
