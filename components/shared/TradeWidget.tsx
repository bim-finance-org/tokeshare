import React, { useState, useEffect } from 'react'
import TokenInput from './TokenInput'
import TokenSelector from './TokenSelector'
import TokenDisplay from '@/components/TokenDisplay'
import { useAccount } from 'wagmi'
import CryptoBalance from './CryptoBalance'
import MaxButton from './MaxButton'

interface TradeWidgetProps {
  type: 'fiat' | 'crypto' | 'stablecoin';
  blockchain?: string;
  label: string;
  defaultToken?: string;
  value?: string;
  onValueChange: (value: string) => void;
  onTokenChange: (token: string) => void;
  showBalance?: boolean;
  readOnly?: boolean;
}

const TradeWidget = ({
  type,
  blockchain = 'Polygon',
  label,
  defaultToken,
  value,
  onValueChange,
  onTokenChange,
  showBalance = false,
  readOnly = false,
}: TradeWidgetProps) => {
  const [selectedToken, setSelectedToken] = useState(defaultToken || 'USDC');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const { address } = useAccount();

  // Vérifie si le token est TGG
  const isTGG = selectedToken === 'TGG';

  const handleTokenSelect = (token: string) => {
    console.log(token);
    setSelectedToken(token);
    console.log(selectedToken);
    onTokenChange(token);
    setIsSelectorOpen(false);
  };

  const handleMaxClick = (maxValue: string) => {
    // Formater la valeur max pour enlever les zéros inutiles
    const numValue = parseFloat(maxValue);
    if (!isNaN(numValue)) {
      onValueChange(numValue.toString());
    }
  };

  useEffect(() => {
    setSelectedToken(defaultToken || 'USDC');
  }, [defaultToken]);

  if(isSelectorOpen) {
    return (
        <TokenSelector
          type={type}
          blockchain={blockchain}
          onSelect={(token) => handleTokenSelect(token)}
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
        />
    )
  } 

  return (
    <div className="bg-color1 p-4 rounded-xl shadow-md">
      <div className="flex justify-between items-center gap-4">
        <div>
          <TokenInput
            label={label}
            value={value || ''}
            onChange={onValueChange}
            placeholder={isTGG ? "1" : "50"}
            disabled={isTGG && type === "stablecoin"}
          />
        </div>
        
        {/* Bouton MAX - placé entre l'input et l'icône */}
        {!readOnly && showBalance && !(isTGG && type === "stablecoin") && (
          <div className="flex items-end pb-3">
            <MaxButton
              currency={selectedToken}
              blockchain={blockchain}
              onMaxClick={handleMaxClick}
            />
          </div>
        )}
        
        <div className="flex flex-col items-end gap-2">
          <TokenDisplay
            token={selectedToken}
            isOpenable={!isTGG}
            onTokenClick={() => !isTGG && setIsSelectorOpen(true)}
          />
          {showBalance && (
            <CryptoBalance 
              currency={selectedToken} 
              blockchain={blockchain}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default TradeWidget
