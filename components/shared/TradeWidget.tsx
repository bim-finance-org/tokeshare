import React from 'react';
import TokenInput from './TokenInput';
import TokenDisplay from '@/components/shared/TokenDisplay';
import CryptoBalance from './CryptoBalance';
import MaxButton from './MaxButton';
import { Blockchain } from '@/enums/Blockchain';

export interface TokenSelectorConfig {
  type: 'fiat' | 'crypto' | 'stablecoin';
  blockchain: Blockchain;
  selected: string;
  onSelect: (token: string) => void;
}

interface TradeWidgetProps {
  type: 'fiat' | 'crypto' | 'stablecoin';
  blockchain?: Blockchain;
  label: string;
  defaultToken?: string;
  value?: string;
  onValueChange: (value: string) => void;
  onTokenChange: (token: string) => void;
  showBalance?: boolean;
  readOnly?: boolean;
  lockedToken?: boolean;
  // Opening the token list is delegated to the parent so the picker can render
  // at the swap-card level and cover the whole body (widgets + info + CTA)
  // instead of being trapped inside this widget's box.
  onOpenSelector: (config: TokenSelectorConfig) => void;
}

const TradeWidget = ({
  type,
  blockchain = Blockchain.Polygon,
  label,
  defaultToken,
  value,
  onValueChange,
  onTokenChange,
  showBalance = false,
  readOnly = false,
  lockedToken = false,
  onOpenSelector,
}: TradeWidgetProps) => {
  // The selected token is fully controlled by the parent via `defaultToken`.
  const selectedToken = defaultToken || 'USDC';

  // Vérifie si le token est un crypto token fixe (non-stablecoin)
  const isTGG =
    selectedToken === 'TGG' || selectedToken === 'TSG' || selectedToken === 'TFT_001' || selectedToken === 'TMC';

  const handleMaxClick = (maxValue: string) => {
    // Formater la valeur max pour enlever les zéros inutiles
    const numValue = parseFloat(maxValue);
    if (!isNaN(numValue)) {
      onValueChange(numValue.toString());
    }
  };

  const canOpen = !isTGG && !lockedToken;
  const openSelector = () => {
    if (canOpen) onOpenSelector({ type, blockchain, selected: selectedToken, onSelect: onTokenChange });
  };

  return (
    <div className="bg-color1 p-3.5 sm:p-4 rounded-2xl ring-1 ring-inset ring-black/5 transition duration-200 hover:ring-black/10 focus-within:ring-2 focus-within:ring-blue-400">
      <div className="flex justify-between items-center gap-2 sm:gap-4">
        <div>
          <TokenInput
            label={label}
            value={value || ''}
            onChange={onValueChange}
            placeholder={isTGG ? '1' : '50'}
            disabled={readOnly}
          />
        </div>

        {/* Bouton MAX - placé entre l'input et l'icône */}
        {!readOnly && showBalance && !(isTGG && type === 'stablecoin') && (
          <div className="flex items-end pb-3">
            <MaxButton currency={selectedToken} blockchain={blockchain} onMaxClick={handleMaxClick} />
          </div>
        )}

        <div className="flex flex-col items-end gap-1 sm:gap-2 flex-shrink-0">
          <TokenDisplay token={selectedToken} isOpenable={canOpen} onTokenClick={openSelector} />
          {showBalance && <CryptoBalance currency={selectedToken} blockchain={blockchain} />}
        </div>
      </div>
    </div>
  );
};

export default TradeWidget;
