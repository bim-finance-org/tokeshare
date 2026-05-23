import React, { useState, useContext, useEffect } from 'react';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import ConnectButton from '@/components/shared/ConnectButton';
import BuyInfo from './BuyInfo';
import { TokenContexts } from '@/context/TokenContexts';
import { generatePayReference } from '@/utils/RandomRefs';
import { useTGGBalance } from '@/hooks/useTGGBalance';
import { useTGGTransfer } from '@/hooks/useTGGTransfer';
import { useTFTTransfer } from '@/hooks/useTFTTransfer';
import { FEES_COEF, NUMBER_TO_FIXE_2, TFT_001_SELL_FEES_COEF } from '@/constants/constants';
import { Action } from '@/enums/Actions';
import { notify } from '@/lib/notify';

interface UserFormProps {
  type: 'buy' | 'sell';
  amount: string;
  currency: string;
  crypto: string;
  tggAmount: string;
  tggPrice: number;
  setShowUserForm: (show: boolean) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  iban?: string;
}

const BENEFICIARY = 'Tokeshare';
const IBAN = 'FR76 1695 8000 0103 0490 4861 482';
const ALIAS = 'Tokeshare';
const BANK = 'Qonto';

const UserForm = ({ type, amount, currency, crypto, tggAmount, tggPrice, setShowUserForm }: UserFormProps) => {
  const {
    buy: { blockchain: buyBlockchain },
    sell: { blockchain: sellBlockchain },
  } = useContext(TokenContexts);

  const { isConnected, address } = useAccount();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userFormData');
      if (saved) return JSON.parse(saved);
    }
    return {
      firstName: '',
      lastName: '',
      email: '',
      iban: type === 'sell' ? '' : undefined,
    };
  });

  const [ref, setRef] = useState<string>(() => generatePayReference());

  const isTFT = crypto === 'TFT_001';

  const blockchain = type === Action.Sell ? sellBlockchain : buyBlockchain;
  const { formattedBalance, checkSufficientBalance, isLoading: balanceLoading } = useTGGBalance(address, blockchain);
  const tggTransfer = useTGGTransfer();
  const tftTransfer = useTFTTransfer();

  const activeTransfer = isTFT ? tftTransfer : tggTransfer;
  const transferPending = activeTransfer.isPending;
  const transferError = activeTransfer.error;
  const hash = activeTransfer.hash;

  const {
    data: receipt,
    isLoading: receiptLoading,
    isSuccess: receiptSuccess,
    isError: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const transferInfo = {
    amount: `${amount} ${currency}`,
    beneficiary: BENEFICIARY,
    iban: IBAN,
    alias: ALIAS,
    bank: BANK,
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userFormData', JSON.stringify(formData));
    }
  }, [formData]);

  useEffect(() => {
    if (transferError) notify.error(transferError);
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
          crypto: crypto,
          cryptoAmount: cryptoAmount,
          fees: feesValue,
        };
      } else {
        const cryptoAmount = parseFloat(tggAmount);
        const fiatAmount = parseFloat(amount);
        const feesCoef = isTFT ? TFT_001_SELL_FEES_COEF : FEES_COEF;
        const feesValue = parseFloat((fiatAmount * feesCoef).toFixed(NUMBER_TO_FIXE_2));

        apiData = {
          ref: ref,
          email: formData.email,
          fullName: `${formData.firstName} ${formData.lastName}`,
          iban: formData.iban || '',
          status: 'pending',
          blockchain: sellBlockchain,
          fiat: currency,
          fiatAmount: fiatAmount,
          crypto: crypto,
          cryptoAmount: cryptoAmount,
          fees: feesValue,
          paymentMethod: 'bank_transfer',
          txHash: hash || null,
        };
      }

      const endpoint = type === 'buy' ? '/api/transactions/buy' : '/api/transactions/sell';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(data);
        throw new Error(data.error || 'An error occurred during the transaction');
      }

      setShowConfirmation(true);
    } catch (err) {
      if (err instanceof SyntaxError && err.message.includes('JSON')) {
        notify.error('Server connection error. Please try again later.');
      } else {
        notify.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Déclaré après handleApiSubmission pour éviter la TDZ.
  useEffect(() => {
    if (receiptSuccess && hash) {
      handleApiSubmission();
    } else if (receiptError) {
      notify.error(receiptError, { fallback: 'Transaction failed. Please contact support for assistance.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptSuccess, receiptError, hash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      return;
    }

    try {
      if (type === Action.Buy) {
        setIsLoading(true);
        await handleApiSubmission();
      } else {
        if (isTFT) {
          tftTransfer.transferTFTToTokeShare(tggAmount);
        } else {
          tggTransfer.transferTGGToTokeShare(tggAmount, blockchain);
        }
      }
    } catch (err) {
      notify.error(err);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="p-6 w-full text-color4 max-w-md mx-auto rounded-2xl space-y-4 ">
      {!showConfirmation ? (
        <>
          <button onClick={() => setShowUserForm(false)} className="bg-color4 text-white p-2 rounded-sm">
            Go back
          </button>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="bg-gray-200 p-4 rounded-xl">
              <label className="block text-sm mb-2">
                {type === Action.Buy ? 'Reception address' : 'Your wallet address'}
              </label>
              <ConnectButton />
            </div>

            {type === Action.Sell && (transferPending || receiptLoading) && (
              <div className="bg-yellow-50 p-4 rounded-xl">
                <p className="text-yellow-800">
                  {transferPending
                    ? `Please confirm the ${crypto} transfer in your wallet...`
                    : 'Waiting for transaction confirmation...'}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!isConnected || isLoading || transferPending || receiptLoading}
              className="w-full bg-color4 text-white py-3 rounded-xl font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || transferPending || receiptLoading
                ? 'Processing...'
                : type === Action.Buy
                  ? Action.Buy
                  : Action.Sell}
            </button>
          </form>
        </>
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
              <p>
                Your sale operation number <span className="font-bold">{ref}</span> has been successfully processed.
              </p>
              <p className="my-3">
                You should receive the transfer of{' '}
                <span className="font-semibold">
                  {amount} {currency}
                </span>{' '}
                on your account in a delay of 2 to 7 days, depending on the usual processing time of your bank.
              </p>
              <p className="my-3">
                If you encounter difficulties, please do not hesitate to contact us. We thank you for your trust.
              </p>
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
