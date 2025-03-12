import React, { useState } from "react";
import { useAccount } from 'wagmi';
import ConnectButton from "@/app/components/shared/ConnectButton";
import BuyInfo from "./BuyInfo";

interface UserFormProps {
  type: 'buy' | 'sell';
  amount: string;
  currency: string;
  tggAmount: string;
  tggPrice: number;
}

const UserForm = ({ type, amount, currency, tggAmount, tggPrice }: UserFormProps) => {
  const { isConnected, address } = useAccount();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    iban: type === 'sell' ? '' : undefined,
  });

  // Informations de transfert pour le type 'buy'
  const transferInfo = {
    amount: `${amount} ${currency}`,
    beneficiary: "Tokeshare",
    iban: "FR76 1695 8000 0103 0490 4861 482",
    alias: "Tokeshare",
    bank: "Qonto"
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'buy' ? isConnected : true) {
      setShowConfirmation(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="p-6 w-full text-color4 max-w-md mx-auto rounded-2xl space-y-4">
      {!showConfirmation ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Section */}
          <div className="bg-gray-200 p-4 rounded-xl">
            <label className="block text-sm mb-2">Name</label>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last name"
                  className="w-full bg-transparent text-lg font-medium outline-none"
                  required
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First name"
                  className="w-full bg-transparent text-lg font-medium outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Mail Section */}
          <div className="bg-gray-200 p-4 rounded-xl">
            <label className="block text-sm mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              className="w-full bg-transparent text-lg font-medium outline-none"
              required
            />
          </div>

          {/* IBAN Section - Only for Sell */}
          {type === 'sell' && (
            <div className="bg-gray-200 p-4 rounded-xl">
              <label className="block text-sm mb-2">IBAN</label>
              <input
                type="text"
                name="iban"
                value={formData.iban}
                onChange={handleInputChange}
                placeholder="Your IBAN"
                className="w-full bg-transparent text-lg font-medium outline-none"
                required
              />
            </div>
          )}

          {/* Wallet Connection - Only for Buy */}
          {type === 'buy' && (
            <div className="bg-gray-200 p-4 rounded-xl">
              <label className="block text-sm mb-2">Reception address</label>
              <ConnectButton/>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={type === 'buy' && !isConnected}
            className="w-full bg-color4 text-white py-3 rounded-xl font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {type === 'buy' ? 'Buy' : 'Sell'}
          </button>
        </form>
      ) : (
        // Affichage conditionnel selon le type après soumission
        <>
          {type === 'buy' && (
            // Informations de transfert pour Buy
            <div className="space-y-4">
              <BuyInfo 
                amount={transferInfo.amount}
                beneficiary={transferInfo.beneficiary}
                iban={transferInfo.iban}
                alias={transferInfo.alias}
                bank={transferInfo.bank}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserForm;
