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
      <p className="text-color4 text-sm sm:text-lg font-medium">{label}</p>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        inputMode="decimal"
        maxLength={12}
        className="bg-transparent text-2xl text-color4 font-medium outline-none w-full px-2 py-1 transition-all duration-200"
      />
    </div>
  );
};

export default TokenInput;
