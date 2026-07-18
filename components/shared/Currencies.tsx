import React from 'react';
import { Check } from 'lucide-react';
import CADIcon from '../icons/currency/CADIcon';
import EURIcon from '../icons/currency/EURIcon';
import USDIcon from '../icons/currency/USDIcon';
import CHFIcon from '../icons/currency/CHFIcon';
import GBPIcon from '../icons/currency/GBPIcon';
import { ListFiat } from '@/enums/ListFiat';
import { getEnumValues } from '@/utils/enum';

interface CurrenciesProps {
  onSelect: (currency: ListFiat) => void;
  query?: string;
  selected?: string;
}

const NAMES: Record<ListFiat, string> = {
  [ListFiat.EUR]: 'Euro',
  [ListFiat.USD]: 'US Dollar',
  [ListFiat.CHF]: 'Swiss Franc',
  [ListFiat.GBP]: 'British Pound',
  [ListFiat.CAD]: 'Canadian Dollar',
};

const Currencies = ({ onSelect, query = '', selected }: CurrenciesProps) => {
  const icons: Record<ListFiat, React.FC> = {
    [ListFiat.EUR]: EURIcon,
    [ListFiat.USD]: USDIcon,
    [ListFiat.CHF]: CHFIcon,
    [ListFiat.GBP]: GBPIcon,
    [ListFiat.CAD]: CADIcon,
  };

  const q = query.trim().toLowerCase();
  const filtered = getEnumValues(ListFiat).filter(
    (c) => !q || c.toLowerCase().includes(q) || NAMES[c].toLowerCase().includes(q),
  );

  const renderCurrencyButton = (currency: ListFiat) => {
    const Icon = icons[currency];
    const isSelected = selected === currency;

    return (
      <button
        type="button"
        key={currency}
        onClick={() => onSelect(currency)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors ${
          isSelected ? 'bg-color1' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center">
            <Icon />
          </span>
          <div className="flex min-w-0 flex-col items-start">
            <span className="font-semibold leading-tight text-color4">{currency}</span>
            <span className="max-w-[160px] truncate text-xs text-gray-400">{NAMES[currency]}</span>
          </div>
        </div>
        {isSelected && <Check className="h-4 w-4 shrink-0 text-color2" />}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-0.5">
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No currency matches your search.</p>
      ) : (
        filtered.map(renderCurrencyButton)
      )}
    </div>
  );
};

export default Currencies;
