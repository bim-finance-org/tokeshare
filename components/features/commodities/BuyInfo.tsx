import React from 'react';

interface BuyInfoProps {
  amount: string;
  beneficiary: string;
  iban: string;
  alias: string;
  bank: string;
  ref: string;
}

const BuyInfo = ({ amount, beneficiary, iban, alias, bank, ref }: BuyInfoProps) => {
  return (
    <div className="bg-gray-200 p-6 rounded-xl space-y-4">
      <div>
        <h1 className="text-xl font-bold mb-2">Transfer information</h1>
        <p className="text-gray-600">Please use the following information to make your transfer</p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Amount:</span>
          <span className="font-medium">{amount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Beneficiary:</span>
          <span className="font-medium">{beneficiary}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">IBAN:</span>
          <span className="font-medium">{iban}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Alias:</span>
          <span className="font-medium">{alias}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Bank:</span>
          <span className="font-medium">{bank}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Ref:</span>
          <span className="font-medium">{ref}</span>
        </div>
      </div>
    </div>
  );
};

export default BuyInfo;
