import React, { useState, useContext, useEffect } from "react";
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import ConnectButton from "@/components/shared/ConnectButton";
import BuyInfo from "./BuyInfo";
import { TokenContexts } from "@/context/TokenContexts";
import { generatePayReference } from "@/utils/RandomRefs";
import { useTGGBalance } from "@/hooks/useTGGBalance";
import { useTGGTransfer } from "@/hooks/useTGGTransfer";
import { FEES_COEF, NUMBER_TO_FIXE_2 } from "@/constants/constants";
import { Action } from "@/enums/Actions";

interface UserFormProps {
  type: 'buy' | 'sell';
  amount: string;
  currency: string;
  tggAmount: string;
  tggPrice: number;
}

const BENEFICIARY = "Tokeshare";
const IBAN = "FR76 1695 8000 0103 0490 4861 482";
const ALIAS = "Tokeshare";
const BANK = "Qonto";

const UserForm = ({ type, amount, currency, tggAmount, tggPrice }: UserFormProps) => {
  const { 
    buy: { blockchain: buyBlockchain },
    sell: { blockchain: sellBlockchain }
  } = useContext(TokenContexts);
  
  const { isConnected, address } = useAccount();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    iban: type === 'sell' ? '' : undefined,
  });
  const [ref, setRef] = useState<string>(() => generatePayReference());

  if(address == undefined)
    return;

  const { formattedBalance, checkSufficientBalance, isLoading: balanceLoading } = useTGGBalance(address);
  const { transferTGGToTokeShare, isPending: transferPending, error: transferError, hash } = useTGGTransfer();

  const { data: receipt, isLoading: receiptLoading, isSuccess: receiptSuccess, isError: receiptError } = useWaitForTransactionReceipt({
    hash,
  });

  const transferInfo = {
    amount: `${amount} ${currency}`,
    beneficiary: BENEFICIARY,
    iban: IBAN,
    alias: ALIAS,
    bank: BANK
  };

  useEffect(() => {
    if (receiptSuccess && hash) {
      handleApiSubmission();
    } else if (receiptError) {
      setError("La transaction TGG a échoué. Veuillez contacter le support pour assistance.");
    }
  }, [receiptSuccess, receiptError, hash]);

  useEffect(() => {
    if (transferError) {
      if (transferError.message?.includes('User rejected') || transferError.message?.includes('rejected')) {
        setError("Transaction annulée par l'utilisateur.");
      } else if (transferError.message?.includes('insufficient funds')) {
        setError("Solde insuffisant pour effectuer la transaction.");
      } else {
        setError("Erreur lors du transfert. Veuillez réessayer.");
      }
    }
  }, [transferError]);

  const handleApiSubmission = async () => {
    try {
      
      let apiData;
      
      if (type === 'buy') {
        const cryptoAmount = parseFloat(tggAmount);
        const fiatAmount = parseFloat(amount);
        const feesValue = parseFloat((fiatAmount * FEES_COEF).toFixed(NUMBER_TO_FIXE_2));
        
        apiData = {
          ref: ref, 
          email: formData.email,
          fullName: `${formData.firstName} ${formData.lastName}`,
          cvu: '',
          walletAddress: address || '',
          status: 'pending',
          blockchain: buyBlockchain,
          fiat: currency,
          fiatAmount: fiatAmount,
          crypto: 'TGG',
          cryptoAmount: cryptoAmount,
          fees: feesValue,
        };
      } else {
        // Calculer le mont ant et les frais pour la vente
        const cryptoAmount = parseFloat(tggAmount);
        const fiatAmount = parseFloat(amount);
        const feesValue = parseFloat((fiatAmount * FEES_COEF).toFixed(NUMBER_TO_FIXE_2));
        
        apiData = {
          ref: ref,
          email: formData.email,
          fullName: `${formData.firstName} ${formData.lastName}`,
          iban: formData.iban || '',
          status: 'pending',
          blockchain: sellBlockchain,
          fiat: currency,
          fiatAmount: fiatAmount,
          crypto: 'TGG',
          cryptoAmount: cryptoAmount,
          fees: feesValue,
        };
        console.log(apiData);
      }
      
      const endpoint = type === 'buy' ? '/api/transactions/buy' : '/api/transactions/sell';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.log(data);
        throw new Error(data.error || 'Une erreur est survenue lors de la transaction');
      }
      
      setShowConfirmation(true);
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      
      if (err instanceof SyntaxError && err.message.includes('JSON')) {
        setError("Erreur de connexion au serveur. Veuillez réessayer plus tard.");
      } else {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!isConnected) {
      return;
    }
    
    try {
      if (type === Action.Buy) {
        setIsLoading(true);
        await handleApiSubmission();
      } else {        
        transferTGGToTokeShare(tggAmount);
      }
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const balanceCheck = type === Action.Sell && address ? checkSufficientBalance(tggAmount) : null;

  return (
    <div className="p-6 w-full text-color4 max-w-md mx-auto rounded-2xl space-y-4 ">
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
          {type === Action.Sell && (
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

          {/* Wallet Connection - For both Buy and Sell */}
          <div className="bg-gray-200 p-4 rounded-xl">
            <label className="block text-sm mb-2">
              {type === Action.Buy ? 'Reception address' : 'Your wallet address'}
            </label>
            <ConnectButton/>
          </div>

          {/* Transaction Status - For Sell */}
          {type === Action.Sell && (transferPending || receiptLoading) && (
            <div className="bg-yellow-50 p-4 rounded-xl">
              <p className="text-yellow-800">
                {transferPending ? 'Please confirm the TGG transfer in your wallet...' : 'Waiting for transaction confirmation...'}
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              !isConnected || 
              isLoading || 
              (type === Action.Sell && balanceCheck && !balanceCheck.hasSufficient) ||
              transferPending ||
              receiptLoading
            }
            className="w-full bg-color4 text-white py-3 rounded-xl font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || transferPending || receiptLoading
              ? 'Processing...' 
              : type === Action.Buy 
                ? Action.Buy 
                : Action.Sell}
          </button>
        </form>
      ) : (
        <>
          {type === Action.Buy && (
            <div className="space-y-4">
              <BuyInfo 
                amount={transferInfo.amount}
                beneficiary={transferInfo.beneficiary}
                iban={transferInfo.iban}
                alias={transferInfo.alias}
                bank={transferInfo.bank}
                ref={ref}
              />
            </div>
          )}
          
          {type === Action.Sell && (
            <div className="bg-gray-200 p-6 rounded-xl">
              <h2 className="text-xl font-bold mb-4 text-center">Demand of sale confirmed</h2>
              <p>Your sale operation number <span className="font-bold">{ref}</span> has been successfully processed.</p>
              <p className="my-3">You should receive the transfer of <span className="font-semibold">{amount} {currency}</span> on your account in a delay of 2 to 7 days, depending on the usual processing time of your bank.</p>
              <p className="my-3">If you encounter difficulties, please do not hesitate to contact us. We thank you for your trust.</p>
              <p className="my-3">See you soon on TokeShare.</p>
              <div className="mt-6 text-center text-sm text-gray-600">
                <p>A confirmation email has been sent to {formData.email}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserForm;
