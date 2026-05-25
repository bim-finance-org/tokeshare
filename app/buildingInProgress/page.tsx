'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { getLogger } from '@/lib/logger';

const log = getLogger('building-in-progress');

const BuildingInProgress = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubscribe = async () => {
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!z.string().email().safeParse(email).success) {
      setError('Invalid email address. Please enter a valid one.');
      return;
    }

    try {
      setIsSubmitting(true);
      const body = { email };
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.status < 200 || response.status >= 400) {
        throw new Error();
      }
      setSubmitted(true);
      setEmail(''); // Réinitialisation du champ après soumission
      setError(''); // Supprimer les erreurs après succès
      setIsSubmitting(false);
    } catch (error) {
      setIsSubmitting(false);
      log.error('email subscription failed', error);
      setError('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-color4 text-color1 px-6">
      {/* Section Texte */}
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">🚀 Be the First to Know!</h1>
        <p className="text-lg md:text-xl  mb-6 max-w-2xl">
          Our platform is **almost ready!** 🎉 Join our early access list to receive exclusive updates and early access
          to Tokeshare.
        </p>
      </div>

      {/* Formulaire Email */}
      <div className="w-full max-w-md  p-6 rounded-lg shadow-lg">
        {submitted ? (
          <p className="text-green-400 font-semibold text-center">
            ✅ Thank you! We’ll keep you updated. Stay tuned! 🎉
          </p>
        ) : (
          <>
            <p className=" mb-3">Sign up for early access:</p>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(''); // Supprime l'erreur en cas de modification
              }}
              className={`w-full mb-2 bg-color1 text-color4 ${error ? 'border-red-500' : 'border-gray-600'}`}
              disabled={isSubmitting}
            />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <Button
              className="w-full bg-color2 hover:bg-blue-500 transition-all disabled:bg-gray-600"
              onClick={handleSubscribe}
              disabled={!email.trim() || !z.string().email().safeParse(email).success || isSubmitting}
            >
              Notify Me
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default BuildingInProgress;
