import React from 'react';
import ArrowDownIcon from '@/components/icons/arrows/ArrowDownIcon';
import EURIcon from '@/components/icons/currency/EURIcon';
import TGGIcon from '@/components/icons/currency/TGGIcon';
import CHFIcon from '@/components/icons/currency/CHFIcon';
import GBPIcon from '@/components/icons/currency/GBPIcon';
import CADIcon from '@/components/icons/currency/CADIcon';
import USDIcon from '@/components/icons/currency/USDIcon';
import USDTIcon from '@/components/icons/currency/USDTIcon';
import USDCIcon from '@/components/icons/currency/USDCIcon';
import DAIIcon from '@/components/icons/currency/DAIIcon';
import EURSIcon from '@/components/icons/currency/EURSIcon';
import CRVIcon from '@/components/icons/currency/CRVIcon';
import BOLDIcon from '@/components/icons/currency/BOLDIcon';
import EURCIcon from '@/components/icons/currency/EURCIcon';
import EURAIcon from '@/components/icons/currency/EURAIcon';
import USDCEIcon from '@/components/icons/currency/USDCIcon';
import TMCIcon from '@/components/icons/currency/TMCIcon';
const TokenDisplay = ({
  token,
  isOpenable,
  onTokenClick,
}: {
  token: string;
  isOpenable: boolean;
  onTokenClick: () => void;
}) => {
  return (
    <div className="flex items-center gap-1 sm:gap-2 border border-color4 rounded-lg p-1.5 sm:p-2 cursor-pointer" onClick={onTokenClick}>
      {token === 'EUR' && <EURIcon />}
      {token === 'TGG' && <TGGIcon />}
      {token === 'CHF' && <CHFIcon />}
      {token === 'GBP' && <GBPIcon />}
      {token === 'CAD' && <CADIcon />}
      {token === 'USD' && <USDIcon />}
      {token === 'USDT' && <USDTIcon />}
      {token === 'USDC' && <USDCIcon />}
      {token === 'DAI' && <DAIIcon />}
      {token === 'EURS' && <EURSIcon />}
      {token === 'CRVUSD' && <CRVIcon />}
      {token === 'BOLD' && <BOLDIcon />}
      {token === 'EURC' && <EURCIcon />}
      {token === 'EURA' && <EURAIcon />}
      {token === 'USDCE' && <USDCEIcon />}
      {token === 'TMC' && <TMCIcon />}
      <span className="font-medium text-color4 text-sm sm:text-base">{token}</span>
      {isOpenable && <ArrowDownIcon strokeColor="#4F5B76" className="w-10 h-4" />}
    </div>
  );
};

export default TokenDisplay;
