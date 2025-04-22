"use client";

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface BuyTransaction {
  id: number
  status: 'completed' | 'pending' | 'failed' | 'receipt'
  walletAddress: string
  blockchain: string
  crypto: string
  amount: number
  ref: string
  date: Date
  email: string
  cvu: string
}

const BuyModal = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchRef, setSearchRef] = useState<string>('')
  const [transactions, setTransactions] = useState<BuyTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedTransactionId, setExpandedTransactionId] = useState<number | null>(null)
  const [validationStep, setValidationStep] = useState<number | null>(null)
  const [newAmount, setNewAmount] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch('/api/transactions/buy')
        
        if (response.status === 401) {
          // User is not authenticated
          signOut({ callbackUrl: '/dashboard' });
          return;
        }
        
        if (!response.ok) {
          throw new Error('Error fetching data')
        }
        
        const data = await response.json()
        setTransactions(data)
      } catch (error) {
        console.error('Error fetching transactions:', error)
        setError('Unable to load transactions. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const filteredData = transactions.filter(transaction => {
    const statusMatch = selectedStatus === 'all' || transaction.status === selectedStatus
    const refMatch = searchRef === '' || transaction.ref.toLowerCase().includes(searchRef.toLowerCase())
    return statusMatch && refMatch
  })

  const handleChangeStatus = async (transactionId: number, newStatus: 'pending' | 'completed' | 'failed' | 'receipt') => {
    try {
      setError(null);
      const response = await fetch(`/api/transactions/buy/${transactionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.status === 401) {
        // User is not authenticated
        signOut({ callbackUrl: '/dashboard' });
        return;
      }

      if (!response.ok) {
        throw new Error('Error updating status');
      }

      // Update local state
      setTransactions(prevTransactions =>
        prevTransactions.map(transaction =>
          transaction.id === transactionId
            ? { ...transaction, status: newStatus }
            : transaction
        )
      );

      // Close expanded menu
      setExpandedTransactionId(null);
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Unable to update status. Please try again.');
    }
  };

  const handleReceipt = async (transactionId: number) => {
    try {
      setError(null);
      // Call API to change status to receipt
      const response = await fetch(`/api/transactions/buy/${transactionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'receipt' }),
      });

      if (response.status === 401) {
        // User is not authenticated
        signOut({ callbackUrl: '/dashboard' });
        return;
      }

      if (!response.ok) {
        throw new Error('Error updating status');
      }

      // Update local data
      setTransactions(prevTransactions =>
        prevTransactions.map(transaction =>
          transaction.id === transactionId
            ? { ...transaction, status: 'receipt' }
            : transaction
        )
      );

      // Open interface with three buttons
      setExpandedTransactionId(transactionId);
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Unable to update status. Please try again.');
    }
  };

  const handleStartValidation = (transactionId: number, currentAmount: number) => {
    setValidationStep(transactionId);
    setNewAmount(currentAmount.toString());
  };

  const handleConfirmValidation = async (transactionId: number) => {
    try {
      setError(null);
      
      // Validate input
      const amount = parseFloat(newAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      
      // First update the status to completed
      const statusResponse = await fetch(`/api/transactions/buy/${transactionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (statusResponse.status === 401) {
        signOut({ callbackUrl: '/dashboard' });
        return;
      }

      if (!statusResponse.ok) {
        throw new Error('Error updating status');
      }

      // Then update the amount
      const amountResponse = await fetch(`/api/transactions/buy/${transactionId}/amount`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (amountResponse.status === 401) {
        signOut({ callbackUrl: '/dashboard' });
        return;
      }

      if (!amountResponse.ok) {
        throw new Error('Error updating amount');
      }

      const updatedTransaction = await amountResponse.json();

      // Update local state
      setTransactions(prevTransactions =>
        prevTransactions.map(transaction =>
          transaction.id === transactionId
            ? { ...transaction, status: 'completed', amount: amount }
            : transaction
        )
      );

      // Reset validation step and amount
      setValidationStep(null);
      setNewAmount('');
      setExpandedTransactionId(null);
    } catch (error) {
      console.error('Error updating transaction:', error);
      setError('Unable to update transaction. Please try again.');
    }
  };

  const handleCancelValidation = () => {
    setValidationStep(null);
    setNewAmount('');
  };

  return (
    <div className='w-full h-full p-4'>
      <div className="mb-4 flex gap-4">
        <div className="w-48">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Filter by status</label>
          <select
            id="status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="receipt">Receipt</option>
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search by reference</label>
          <input
            type="text"
            id="search"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            placeholder="Enter a reference..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blockchain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crypto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CVU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      transaction.status === 'receipt' ? 'bg-blue-100 text-blue-800' :
                      transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.walletAddress}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.blockchain}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.crypto}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.amount.toString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.ref}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.cvu}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.status === 'completed' || transaction.status === 'failed' ? (
                      <span className="text-gray-500 italic">No action available</span>
                    ) : validationStep === transaction.id ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={newAmount}
                            onChange={(e) => setNewAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter amount"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleConfirmValidation(transaction.id)}
                            className="bg-green-500 text-white px-4 py-2 rounded-md">
                            Confirm
                          </button>
                          <button 
                            onClick={handleCancelValidation}
                            className="bg-gray-500 text-white px-4 py-2 rounded-md">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : expandedTransactionId === transaction.id ? (
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => handleChangeStatus(transaction.id, 'pending')}
                          className="bg-yellow-500 text-white px-4 py-2 rounded-md">
                          In Progress
                        </button>
                        <button 
                          onClick={() => handleStartValidation(transaction.id, transaction.amount)}
                          className="bg-green-500 text-white px-4 py-2 rounded-md">
                          Validate
                        </button>
                        <button 
                          onClick={() => handleChangeStatus(transaction.id, 'failed')}
                          className="bg-red-500 text-white px-4 py-2 rounded-md">
                          Cancel
                        </button>
                      </div>
                    ) : transaction.status === 'pending' ? (
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => handleReceipt(transaction.id)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-md">
                          Receipt
                        </button>
                        <button 
                          onClick={() => handleChangeStatus(transaction.id, 'failed')}
                          className="bg-red-500 text-white px-4 py-2 rounded-md">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => handleChangeStatus(transaction.id, 'failed')}
                          className="bg-red-500 text-white px-4 py-2 rounded-md">
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default BuyModal