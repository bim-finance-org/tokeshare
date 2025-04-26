import React, { useState, useContext } from "react";
import { useAccount } from 'wagmi';
import ConnectButton from "@/app/components/shared/ConnectButton";
import BuyInfo from "./BuyInfo";
import { TokenContexts } from "@/app/context/TokenContexts";
import { generatePayReference } from "@/app/utils/RandomRefs";

interface UserFormProps {
  type: 'buy' | 'sell';
  amount: string;
  currency: string;
  tggAmount: string;
  tggPrice: number;
}

const UserForm = ({ type, amount, currency, tggAmount, tggPrice }: UserFormProps) => {
  // Récupérer les valeurs du contexte pour la blockchain
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
  const [ref, setRef] = useState<string>('');

  // Informations de transfert pour le type 'buy'
  const transferInfo = {
    amount: `${amount} ${currency}`,
    beneficiary: "Tokeshare",
    iban: "FR76 1695 8000 0103 0490 4861 482",
    alias: "Tokeshare",
    bank: "Qonto"
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Vérifier que l'utilisateur est connecté pour les achats
    if (type === 'buy' && !isConnected) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Préparer les données pour l'API
      let apiData;

      const transactionRef = generatePayReference();
      setRef(transactionRef);
      
      if (type === 'buy') {
        // Calculer le montant et les frais pour l'achat
        const amountValue = parseFloat(tggAmount);
        const feesValue = parseFloat((parseFloat(amount) * 0.025).toFixed(2)); // Frais calculés en fiat (2.5% du montant)
        
        // Données pour une transaction d'achat
        apiData = {
          walletAddress: address || '',
          blockchain: buyBlockchain,
          crypto: 'TGG',
          fiatCurrency: currency,
          amount: amountValue,
          fees: feesValue,
          ref: transactionRef, 
          email: formData.email,
          fullName: `${formData.firstName} ${formData.lastName}`,
          cvu: '',
          status: 'pending'
        };
      } else {
        // Calculer le montant et les frais pour la vente
        const amountValue = parseFloat(amount);
        const feesValue = parseFloat((amountValue * 0.025).toFixed(2)); // Frais calculés en fiat (2.5% du montant)
        
        // Données pour une transaction de vente
        apiData = {
          iban: formData.iban || '',
          blockchain: sellBlockchain,
          fiat: currency,
          cryptoCurrency: 'TGG',
          amount: amountValue,
          fees: feesValue,
          email: formData.email,
          fullName: `${formData.firstName} ${formData.lastName}`,
          ref: transactionRef,
          status: 'pending'
        };
        console.log(apiData);
      }
      
      // Faire l'appel API en fonction du type (achat ou vente)
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
        throw new Error(data.error || 'Une erreur est survenue lors de la transaction');
      }
      
      // Si tout va bien, afficher la confirmation
      setShowConfirmation(true);
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      
      // Gérer l'erreur de parsing JSON si elle se produit
      if (err instanceof SyntaxError && err.message.includes('JSON')) {
        setError("Erreur de connexion au serveur. Veuillez réessayer plus tard.");
      } else {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      }
    } finally {
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

  return (
    <div className="p-6 w-full text-color4 max-w-md mx-auto rounded-2xl space-y-4">
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
          {type === 'sell' && (
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

          {/* Wallet Connection - Only for Buy */}
          {type === 'buy' && (
            <div className="bg-gray-200 p-4 rounded-xl">
              <label className="block text-sm mb-2">Reception address</label>
              <ConnectButton/>
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
            disabled={(type === 'buy' && !isConnected) || isLoading}
            className="w-full bg-color4 text-white py-3 rounded-xl font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Traitement en cours...' : type === 'buy' ? 'Buy' : 'Sell'}
          </button>
        </form>
      ) : (
        // Affichage conditionnel selon le type après soumission
        <>
          {type === 'buy' && (
            // Informations de transfert pour Buy
            <div className="space-y-4">
              <BuyInfo 
                amount={transferInfo.amount}
                beneficiary={transferInfo.beneficiary}
                iban={transferInfo.iban}
                alias={transferInfo.alias}
                bank={transferInfo.bank}
              />
            </div>
          )}
          
          {type === 'sell' && (
            <div className="bg-gray-200 p-6 rounded-xl">
              <h2 className="text-xl font-bold mb-4 text-center">Demande de vente confirmée</h2>
              <p>Votre opération de vente n°<span className="font-bold">{ref}</span> a été traitée avec succès.</p>
              <p className="my-3">Vous devriez recevoir le virement de <span className="font-semibold">{amount} {currency}</span> sur votre compte dans un délai de 2 à 7 jours, en fonction du temps de traitement habituel de votre banque.</p>
              <p className="my-3">Si vous rencontrez des difficultés, n'hésitez pas à nous contacter. Nous vous remercions de votre confiance.</p>
              <p className="my-3">À bientôt sur TokShare.</p>
              <div className="mt-6 text-center text-sm text-gray-600">
                <p>Un email de confirmation a été envoyé à {formData.email}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserForm;
