import React from 'react';
import { useAccount } from 'wagmi';
import { useTokenBalance } from '@/utils/blockchainUtils';
import { Blockchain } from '@/enums/Blockchain';

const CryptoBalance = ({ currency, blockchain }: { currency: string; blockchain: Blockchain }) => {
  const { isConnected } = useAccount();
  const balance = useTokenBalance(currency, blockchain);

  // Fonction pour formater la balance avec max 4 décimales
  const formatBalance = (balance: string): string => {
    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) return '0';
    return numBalance.toFixed(4).replace(/\.?0+$/, ''); // Supprime les zéros inutiles
  };

  // Nothing to show until a wallet is connected.
  if (!isConnected) return null;

  return (
    <div className="flex gap-1 sm:gap-2 whitespace-nowrap">
      <p className="text-color4 text-xs sm:text-sm font-medium">Balance:</p>
      <p className="text-color4 text-xs sm:text-sm font-medium">{formatBalance(balance)}</p>
    </div>
  );
};

export default CryptoBalance;
