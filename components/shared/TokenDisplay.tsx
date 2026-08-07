import React from 'react';
import ArrowDownIcon from '@/components/icons/arrows/ArrowDownIcon';
import EURIcon from '@/components/icons/currency/EURIcon';
import TGGIcon from '@/components/icons/currency/TGGIcon';
import TSGIcon from '@/components/icons/currency/TSGIcon';
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
import USDSIcon from '@/components/icons/currency/USDSIcon';
import TMCIcon from '@/components/icons/currency/TMCIcon';
import TSP500Icon from '@/components/icons/currency/TSP500Icon';
import TFTIcon from '@/components/icons/currency/TFTIcon';
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
    <div
      className={`flex items-center gap-1.5 sm:gap-2 bg-white ring-1 ring-inset ring-black/5 shadow-sm rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2 transition duration-200 ${
        isOpenable ? 'cursor-pointer hover:ring-black/20 hover:shadow' : 'cursor-default'
      }`}
      onClick={onTokenClick}
    >
      {token === 'EUR' && <EURIcon />}
      {token === 'TGG' && <TGGIcon />}
      {token === 'TSG' && <TSGIcon />}
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
      {token === 'USDS' && <USDSIcon />}
      {token === 'TMC' && <TMCIcon />}
      {token === 'TSP500' && <TSP500Icon />}
      {token === 'TFT_001' && <TFTIcon />}
      <span className="font-titleSemibold text-color4 text-sm sm:text-base">{token}</span>
      {isOpenable && <ArrowDownIcon strokeColor="#4F5B76" className="w-4 h-4" />}
    </div>
  );
};

export default TokenDisplay;
