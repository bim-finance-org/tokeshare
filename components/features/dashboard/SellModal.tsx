'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { CheckCircle } from 'lucide-react';

type SellStatus = 'completed' | 'pending' | 'failed' | 'received' | 'usdc_pending';

interface SellTransaction {
  id: number;
  status: SellStatus;
  iban: string | null;
  blockchain: string;
  fiat: string;
  fiatAmount: number;
  fees: number;
  ref: string;
  date: Date;
  email: string;
  fullName: string;
  crypto: string;
  cryptoAmount: number;
  paymentMethod?: string | null;
  walletAddress?: string | null;
  txHash?: string | null;
  usdcTxHash?: string | null;
}

type AdminStatus = Exclude<SellStatus, 'usdc_pending'>;

const SellModal = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchRef, setSearchRef] = useState<string>('');
  const [transactions, setTransactions] = useState<SellTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationStep, setValidationStep] = useState<number | null>(null);
  const [newCryptoAmount, setNewCryptoAmount] = useState<number>(0);
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/transactions/sell');

        if (response.status === 401) {
          // User is not authenticated
          signOut({ callbackUrl: '/dashboard' });
          return;
        }

        if (!response.ok) {
          throw new Error('Error fetching data');
        }

        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Unable to load transactions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  const filteredData = transactions.filter((transaction) => {
    const statusMatch = selectedStatus === 'all' || transaction.status === selectedStatus;
    const refMatch = searchRef === '' || transaction.ref.toLowerCase().includes(searchRef.toLowerCase());
    return statusMatch && refMatch;
  });

  const patchTransaction = async (
    transactionId: number,
    payload: { status?: AdminStatus; cryptoAmount?: number },
  ) => {
    const response = await fetch(`/api/transactions/sell/${transactionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      signOut({ callbackUrl: '/dashboard' });
      return null;
    }

    if (!response.ok) {
      throw new Error('Error updating transaction');
    }

    return (await response.json()) as SellTransaction;
  };

  const handleChangeStatus = async (transactionId: number, newStatus: AdminStatus) => {
    try {
      setError(null);
      const updated = await patchTransaction(transactionId, { status: newStatus });
      if (!updated) return;

      setTransactions((prev) =>
        prev.map((transaction) => (transaction.id === transactionId ? updated : transaction)),
      );
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Unable to update status. Please try again.');
    }
  };

  const handleStartValidation = (transactionId: number, currentAmount: number) => {
    setValidationStep(transactionId);
    setNewCryptoAmount(currentAmount);
  };

  const handleConfirmValidation = async (transactionId: number) => {
    try {
      setError(null);

      const cryptoAmount = newCryptoAmount;
      if (isNaN(cryptoAmount) || cryptoAmount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      const updated = await patchTransaction(transactionId, {
        status: 'completed',
        cryptoAmount,
      });
      if (!updated) return;

      setTransactions((prev) =>
        prev.map((transaction) => (transaction.id === transactionId ? updated : transaction)),
      );

      setValidationStep(null);
      setNewCryptoAmount(0);
    } catch (error) {
      console.error('Error updating transaction:', error);
      setError('Unable to update transaction. Please try again.');
    }
  };

  const handleCancelValidation = () => {
    setValidationStep(null);
    setNewCryptoAmount(0);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Show notification
        setShowCopiedNotification(true);
        // Hide after 1 second
        setTimeout(() => {
          setShowCopiedNotification(false);
        }, 1000);
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <div className="w-full h-full p-4 relative">
      {/* Notification de copie */}
      {showCopiedNotification && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-md flex items-center shadow-lg">
          <CheckCircle className="mr-2 h-5 w-5" />
          <span className="font-medium">Copied!</span>
        </div>
      )}

      <div className="mb-4 flex gap-4">
        <div className="w-48">
          <label htmlFor="status" className="block text-sm font-medium text-black mb-1">
            Filter by status
          </label>
          <select
            id="status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all" className="text-black">
              All statuses
            </option>
            <option value="completed" className="text-black">
              Completed
            </option>
            <option value="pending" className="text-black">
              Pending
            </option>
            <option value="failed" className="text-black">
              Failed
            </option>
            <option value="received" className="text-black">
              Received
            </option>
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-black mb-1">
            Search by reference
          </label>
          <input
            type="text"
            id="search"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            placeholder="Enter a reference..."
            className="w-full px-3 py-2 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Loading transactions...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-red-500">{error}</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">No transactions found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IBAN/Wallet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blockchain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FIAT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REF</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Full Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : transaction.status === 'received'
                              ? 'bg-blue-100 text-blue-800'
                              : transaction.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : transaction.status === 'usdc_pending'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.paymentMethod === 'usdc_transfer'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {transaction.paymentMethod === 'usdc_transfer' ? 'USDC' : 'Bank'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.paymentMethod === 'usdc_transfer' ? (
                      <span
                        className="cursor-pointer hover:text-blue-500 hover:underline"
                        onClick={() => handleCopyToClipboard(transaction.walletAddress || '')}
                        title="Click to copy wallet address"
                      >
                        {transaction.walletAddress
                          ? `${transaction.walletAddress.slice(0, 6)}...${transaction.walletAddress.slice(-4)}`
                          : '-'}
                      </span>
                    ) : (
                      <span
                        className="cursor-pointer hover:text-blue-500 hover:underline"
                        onClick={() => handleCopyToClipboard(transaction.iban || '')}
                        title="Click to copy IBAN"
                      >
                        {transaction.iban?.replace(/\s+/g, '') || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.blockchain}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.fiat}{' '}
                    <span
                      className="cursor-pointer hover:text-blue-500 hover:underline"
                      onClick={() =>
                        handleCopyToClipboard(
                          parseFloat((transaction.fiatAmount - transaction.fees).toString()).toFixed(2),
                        )
                      }
                      title="Click to copy fiat amount"
                    >
                      {parseFloat((transaction.fiatAmount - transaction.fees).toString()).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.crypto}{' '}
                    <span
                      className="cursor-pointer hover:text-blue-500 hover:underline"
                      onClick={() => handleCopyToClipboard(transaction.cryptoAmount.toString())}
                      title="Click to copy crypto amount"
                    >
                      {transaction.cryptoAmount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.fiat} {parseFloat(transaction.fees.toString()).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.ref}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {validationStep === transaction.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="number"
                          step="any"
                          value={newCryptoAmount}
                          onChange={(e) => setNewCryptoAmount(parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter crypto amount received"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirmValidation(transaction.id)}
                            className="bg-green-500 text-white px-4 py-2 rounded-md"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={handleCancelValidation}
                            className="bg-gray-500 text-white px-4 py-2 rounded-md"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : transaction.status === 'pending' ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleChangeStatus(transaction.id, 'received')}
                          className="bg-blue-500 text-white px-4 py-2 rounded-md"
                        >
                          Received
                        </button>
                        <button
                          onClick={() => handleChangeStatus(transaction.id, 'failed')}
                          className="bg-red-500 text-white px-4 py-2 rounded-md"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : transaction.status === 'received' ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleStartValidation(transaction.id, transaction.cryptoAmount)}
                          className="bg-green-500 text-white px-4 py-2 rounded-md"
                        >
                          Validate
                        </button>
                        <button
                          onClick={() => handleChangeStatus(transaction.id, 'pending')}
                          className="bg-yellow-500 text-white px-4 py-2 rounded-md"
                        >
                          Back to pending
                        </button>
                        <button
                          onClick={() => handleChangeStatus(transaction.id, 'failed')}
                          className="bg-red-500 text-white px-4 py-2 rounded-md"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : transaction.status === 'completed' || transaction.status === 'failed' ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleChangeStatus(transaction.id, 'pending')}
                          className="bg-gray-500 text-white px-4 py-2 rounded-md"
                        >
                          Reset
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs italic text-gray-400">Automated flow</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SellModal;
