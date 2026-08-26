'use client';

import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function DashboardLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await signIn('credentials', { password, redirect: false });
    setIsLoading(false);

    if (result?.error) {
      // NextAuth returns 'CredentialsSignin' for a rejected password; a custom
      // thrown message (e.g. the rate-limit notice) comes through verbatim.
      setError(result.error === 'CredentialsSignin' ? 'Mot de passe incorrect' : result.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-color1 to-white px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5 sm:p-10">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-color1 text-color4">
          <KeyRound className="h-5 w-5" />
        </span>
        <h1 className="mt-5 font-titleSemibold text-2xl text-color4">Console opérateur</h1>
        <p className="mt-1 text-sm text-gray-500">Accès réservé à l&apos;équipe Tokeshare.</p>

        <form className="mt-8 space-y-4" onSubmit={handleLogin}>
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Mot de passe</span>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 block h-11 w-full rounded-xl border-0 bg-color1 px-4 text-color4 ring-1 ring-inset ring-black/5 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-color4"
              placeholder="••••••••••••"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 ring-1 ring-inset ring-red-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full rounded-full bg-color4 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
