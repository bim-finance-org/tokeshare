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
  const { isConnected } = useAccount();
  const [showBuyInfo, setShowBuyInfo] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    iban: type === 'sell' ? '' : undefined,
  });

  // Example data - replace with your actual data
  const transferInfo = {
    amount: `${amount} ${currency}`,
    tggAmount: `${tggAmount} TGG`,
    tggPrice: `$${tggPrice.toFixed(2)}`,
    beneficiary: "Tokeshare",
    iban: formData.iban || "FR7630006000011234567890189",
    alias: "Tokeshare",
    bank: "BNP Paribas"
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'buy' ? isConnected : true) {
      setShowBuyInfo(true);
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
    <div className="p-6 w-full text-color4 max-w-md mx-auto bg-gray-100 rounded-2xl shadow-md space-y-4">
      {!showBuyInfo ? (
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
              <ConnectButton
                connectText="Connect"
                className={`w-full py-2 rounded-xl font-medium shadow ${
                  isConnected ? "bg-gray-400" : "bg-blue-600 text-white"
                }`}
                showAddress={true}
              />
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
        <div className="space-y-4">
          <BuyInfo 
            amount={transferInfo.amount}
            tggAmount={transferInfo.tggAmount}
            tggPrice={transferInfo.tggPrice}
            beneficiary={transferInfo.beneficiary}
            iban={transferInfo.iban}
            alias={transferInfo.alias}
            bank={transferInfo.bank}
          />
          <button
            onClick={() => setShowBuyInfo(false)}
            className="w-full bg-gray-200 text-color4 py-3 rounded-xl font-medium shadow-sm hover:bg-gray-300 transition-colors"
          >
            Back to Form
          </button>
        </div>
      )}
    </div>
  );
};

export default UserForm;
