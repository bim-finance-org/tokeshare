import React, { useState, useEffect } from 'react'
import TokenInput from './TokenInput'
import TokenSelector from './TokenSelector'
import TokenDisplay from '@/app/components/TokenDisplay'
import { useAccount } from 'wagmi'

interface TradeWidgetProps {
  type: 'fiat' | 'crypto' | 'stablecoin';
  blockchain?: string;
  label: string;
  defaultToken?: string;
  value?: string;
  onValueChange: (value: string) => void;
  onTokenChange: (token: string) => void;
}

const TradeWidget = ({
  type,
  blockchain = 'Polygon',
  label,
  defaultToken,
  value,
  onValueChange,
  onTokenChange,
}: TradeWidgetProps) => {
  const [selectedToken, setSelectedToken] = useState(defaultToken || 'USDC');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const { address } = useAccount();

  // Vérifie si le token est TGG
  const isTGG = selectedToken === 'TGG';

  const handleTokenSelect = (token: string) => {
    setSelectedToken(token);
    onTokenChange(token);
    setIsSelectorOpen(false);
  };

  useEffect(() => {
    setSelectedToken(defaultToken || 'USDC');
  }, [defaultToken]);

  if(isSelectorOpen) {
    return (
      <div className="bg-gray-100 p-4 rounded-xl shadow-md">
        <TokenSelector
          type={type}
          blockchain={blockchain}
          selectedToken={selectedToken}
          onSelect={handleTokenSelect}
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
        />
      </div>
    )
  } 

  return (
    <div className="bg-gray-100 p-4 rounded-xl shadow-md">
      <div className="flex justify-between items-start gap-4">
        <TokenInput
          label={label}
          value={value || ''}
          onChange={onValueChange}
          placeholder='10'
          disabled={isTGG && type === "stablecoin"}
        />
        <TokenDisplay
          token={selectedToken}
          isOpenable={!isTGG}
          onTokenClick={() => !isTGG && setIsSelectorOpen(true)}
        />
      </div>
    
      
    </div>
  )
}

export default TradeWidget
