'use client';

import { useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import React from 'react';
import ContextProvider from '../../context';
import DashBoard from '@/components/features/dashboard/DashBoard';

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await signIn('credentials', {
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      setError('Mot de passe incorrect');
    }
  };

  // Afficher un chargement pendant la vérification de session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, afficher le formulaire de connexion
  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Connexion au Dashboard</h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="password" className="sr-only">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Mot de passe"
                />
              </div>
            </div>

            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est authentifié, afficher le dashboard
  return (
    <div>
      <DashBoard />
      <div className="absolute top-4 right-4">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
