import React from 'react';
import CADIcon from '../icons/currency/CADIcon';
import EURIcon from '../icons/currency/EURIcon';
import USDIcon from '../icons/currency/USDIcon';
import CHFIcon from '../icons/currency/CHFIcon';
import GBPIcon from '../icons/currency/GBPIcon';
import { ListFiat } from '@/enums/ListFiat';
import { getEnumValues } from '@/utils/enum';

interface CurrenciesProps {
  onSelect: (currency: ListFiat) => void;
}

const Currencies = ({ onSelect }: CurrenciesProps) => {
  const renderCurrencyButton = (currency: ListFiat) => {
    const icons: Record<ListFiat, React.FC> = {
      [ListFiat.EUR]: EURIcon,
      [ListFiat.USD]: USDIcon,
      [ListFiat.CHF]: CHFIcon,
      [ListFiat.GBP]: GBPIcon,
      [ListFiat.CAD]: CADIcon,
    };
    const Icon = icons[currency];

    return (
      <button type="button"
        key={currency}
        onClick={() => onSelect(currency)}
        className="flex items-center w-full p-2 hover:bg-gray-200 rounded-lg transition-colors border-b border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Icon />
          <span className="text-color4">{currency}</span>
        </div>
      </button>
    );
  };

  return (
    <div>
      <h1 className="text-2xl text-color2 font-bold border-b-2 border-color2 pb-2">Select a Currency</h1>
      <h2 className="text-lg text-color2 font-bold mt-4 mb-2">Available Currencies</h2>
      <div className="flex flex-col gap-1 mt-4 min-w-[200px]">{getEnumValues(ListFiat).map(renderCurrencyButton)}</div>
    </div>
  );
};

export default Currencies;
