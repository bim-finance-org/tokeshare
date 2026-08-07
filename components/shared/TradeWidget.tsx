import React from 'react';
import TokenInput from './TokenInput';
import TokenDisplay from '@/components/shared/TokenDisplay';
import CryptoBalance from './CryptoBalance';
import MaxButton from './MaxButton';
import { Blockchain } from '@/enums/Blockchain';
import { TOKENS } from '@/config/token';
import { TokenType } from '@/enums/TokenType';

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
  // Shows a skeleton in place of the amount while a quote is being computed
  // (used by the read-only "you receive" widget so the recalculation is visible).
  loading?: boolean;
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
  loading = false,
  onOpenSelector,
}: TradeWidgetProps) => {
  // The selected token is fully controlled by the parent via `defaultToken`.
  const selectedToken = defaultToken || 'USDC';

  // A Tokeshare asset token (TGG, TSG, TMC, TSP500, TFT_001) is imposed by the
  // page it is traded on, so that side of the swap must stay fixed. Derived from
  // the token registry — where every asset token is TokenType.Crypto and every
  // counter-token is a stablecoin — so a newly listed asset is covered without
  // having to remember this spot.
  const isAssetToken = TOKENS[selectedToken]?.type === TokenType.Crypto;

  const handleMaxClick = (maxValue: string) => {
    // Formater la valeur max pour enlever les zéros inutiles
    const numValue = parseFloat(maxValue);
    if (!isNaN(numValue)) {
      onValueChange(numValue.toString());
    }
  };

  const canOpen = !isAssetToken && !lockedToken;
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
            placeholder={isAssetToken ? '1' : '50'}
            disabled={readOnly}
            loading={loading}
          />
        </div>

        {/* Bouton MAX - placé entre l'input et l'icône */}
        {!readOnly && showBalance && !(isAssetToken && type === 'stablecoin') && (
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
