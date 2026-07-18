import React from 'react';

interface TokenInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const TokenInput = ({ label, value, onChange, placeholder, disabled = false }: TokenInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // N'accepte que les chiffres et le point décimal
    if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <div className="w-26 sm:w-40">
      <p className="text-gray-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5">{label}</p>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        inputMode="decimal"
        maxLength={12}
        className="bg-transparent text-2xl sm:text-3xl text-color4 font-titleSemibold outline-none w-full py-1 transition-all duration-200 placeholder:text-gray-300 disabled:cursor-default"
      />
    </div>
  );
};

export default TokenInput;
