"use client";

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface BuyTransaction {
  id: number
  status: 'completed' | 'pending' | 'failed'
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
  const router = useRouter()

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch('/api/transactions/buy')
        
        if (response.status === 401) {
          // L'utilisateur n'est pas authentifié
          signOut({ callbackUrl: '/dashboard' });
          return;
        }
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données')
        }
        
        const data = await response.json()
        setTransactions(data)
      } catch (error) {
        console.error('Erreur lors de la récupération des transactions:', error)
        setError('Impossible de charger les transactions. Veuillez réessayer.')
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

  return (
    <div className='w-full h-full p-4'>
      <div className="mb-4 flex gap-4">
        <div className="w-48">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Filtrer par statut</label>
          <select
            id="status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Rechercher par référence</label>
          <input
            type="text"
            id="search"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            placeholder="Entrez une référence..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Chargement des transactions...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-red-500">{error}</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Aucune transaction trouvée</p>
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
                      'bg-red-100 text-red-800'
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-2">
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-md">
                      Reçus
                    </button>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-md">
                      Annuler
                    </button>
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