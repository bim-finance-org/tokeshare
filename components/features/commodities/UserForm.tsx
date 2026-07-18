import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useMutation } from '@tanstack/react-query';
import ConnectButton from '@/components/shared/ConnectButton';
import BuyInfo from './BuyInfo';
import { useTokenContext } from '@/context/TokenContexts';
import { generatePayReference } from '@/utils/RandomRefs';
import { useTGGBalance } from '@/hooks/useTGGBalance';
import { useTGGTransfer } from '@/hooks/useTGGTransfer';
import { useTSGTransfer } from '@/hooks/useTSGTransfer';
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
  } = useTokenContext();

  const { isConnected, address } = useAccount();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Stable SSR-safe initial: server and client first render produce the same
  // tree. localStorage is read after mount in the effect below.
  const [formData, setFormDataState] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    iban: type === 'sell' ? '' : undefined,
  });

  // Write-through setter: every change is persisted immediately, no separate
  // useEffect needed (and no setState-in-effect lint trip on persist).
  const setFormData = useCallback((next: FormData | ((prev: FormData) => FormData)) => {
    setFormDataState((prev) => {
      const value = typeof next === 'function' ? (next as (p: FormData) => FormData)(prev) : next;
      try {
        localStorage.setItem('userFormData', JSON.stringify(value));
      } catch {
        // quota exceeded or private mode — best effort
      }
      return value;
    });
  }, []);

  // One-shot hydration from localStorage after mount. Necessary for browser-only
  // state; useSyncExternalStore isn't a fit because formData is mutated by user
  // inputs, not just read from storage.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('userFormData');
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot hydration from external storage
        setFormDataState(JSON.parse(saved));
      }
    } catch {
      // ignore malformed entries
    }
  }, []);

  const [ref, setRef] = useState<string>(() => generatePayReference());

  const isTFT = crypto === 'TFT_001';
  const isTSG = crypto === 'TSG';

  const blockchain = type === Action.Sell ? sellBlockchain : buyBlockchain;
  const { formattedBalance, checkSufficientBalance, isLoading: balanceLoading } = useTGGBalance(address, blockchain);
  const tggTransfer = useTGGTransfer();
  const tsgTransfer = useTSGTransfer();
  const tftTransfer = useTFTTransfer();

  const activeTransfer = isTFT ? tftTransfer : isTSG ? tsgTransfer : tggTransfer;
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
    if (transferError) notify.error(transferError);
  }, [transferError]);

  // Posting the transaction to /api/transactions/* is wrapped in a mutation
  // so the success / error / settled state transitions live in the mutation
  // callbacks instead of inside the receipt-success effect — that keeps the
  // effect body free of synchronous setState.
  const submitTransactionMutation = useMutation({
    mutationFn: async () => {
      const cryptoAmount = parseFloat(tggAmount);
      const fiatAmount = parseFloat(amount);
      const isBuy = type === 'buy';
      const feesCoef = isBuy ? FEES_COEF : isTFT ? TFT_001_SELL_FEES_COEF : FEES_COEF;
      const feesValue = parseFloat((fiatAmount * feesCoef).toFixed(NUMBER_TO_FIXE_2));

      const apiData = isBuy
        ? {
            ref,
            email: formData.email,
            fullName: `${formData.firstName} ${formData.lastName}`,
            cvu: '',
            walletAddress: address || '',
            status: 'pending',
            blockchain: buyBlockchain,
            fiat: currency,
            fiatAmount,
            crypto,
            cryptoAmount,
            fees: feesValue,
          }
        : {
            ref,
            email: formData.email,
            fullName: `${formData.firstName} ${formData.lastName}`,
            iban: formData.iban || '',
            status: 'pending',
            blockchain: sellBlockchain,
            fiat: currency,
            fiatAmount,
            crypto,
            cryptoAmount,
            fees: feesValue,
            paymentMethod: 'bank_transfer',
            txHash: hash || null,
          };

      const endpoint = isBuy ? '/api/transactions/buy' : '/api/transactions/sell';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'An error occurred during the transaction');
      }
      return data;
    },
    onSuccess: () => setShowConfirmation(true),
    onError: (err) => {
      if (err instanceof SyntaxError && err.message.includes('JSON')) {
        notify.error('Server connection error. Please try again later.');
      } else {
        notify.error(err);
      }
    },
    onSettled: () => setIsLoading(false),
  });

  useEffect(() => {
    if (receiptSuccess && hash) {
      submitTransactionMutation.mutate();
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
        await submitTransactionMutation.mutateAsync();
      } else {
        if (isTFT) {
          tftTransfer.transferTFTToTokeShare(tggAmount);
        } else if (isTSG) {
          tsgTransfer.transferTSGToTokeShare(tggAmount, blockchain);
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
          <button type="button" onClick={() => setShowUserForm(false)} className="bg-color4 text-white p-2 rounded-sm">
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
