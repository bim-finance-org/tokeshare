"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const BuildingInProgress = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Fonction pour valider l'email avec une regex
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubscribe = async () => {
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Invalid email address. Please enter a valid one.");
      return;
    }

    try {
      // TODO: Envoyer l'email à votre backend / service d'emailing (Mailchimp, Firebase, SendGrid, etc.)
      console.log("Email enregistré:", email);

      // Simuler un enregistrement réussi
      setSubmitted(true);
      setEmail(""); // Réinitialisation du champ après soumission
      setError(""); // Supprimer les erreurs après succès
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      setError("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-6">
      {/* Section Texte */}
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">🚀 Be the First to Know!</h1>
        <p className="text-lg md:text-xl text-gray-400 mb-6 max-w-2xl">Our platform is **almost ready!** 🎉 Join our early access list to receive exclusive updates and early access to Tokeshare.</p>
      </div>

      {/* Formulaire Email */}
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-lg">
        {submitted ? (
          <p className="text-green-400 font-semibold text-center">✅ Thank you! We’ll keep you updated. Stay tuned! 🎉</p>
        ) : (
          <>
            <p className="text-gray-300 mb-3">Sign up for early access:</p>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(""); // Supprime l'erreur en cas de modification
              }}
              className={`w-full mb-2 bg-gray-700 text-white ${error ? "border-red-500" : "border-gray-600"}`}
            />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <Button className="w-full bg-blue-600 hover:bg-blue-500 transition-all disabled:bg-gray-600" onClick={handleSubscribe} disabled={!email.trim() || !isValidEmail(email)}>
              Notify Me
            </Button>
          </>
        )}
      </div>

      {/* Bouton Retour Home */}
      <Link href="/">
        <Button variant="outline" className="mt-6 text-black border-white hover:bg-white hover:text-gray-900 transition-all">
          ⬅ Back to Home
        </Button>
      </Link>
    </div>
  );
};

export default BuildingInProgress;
