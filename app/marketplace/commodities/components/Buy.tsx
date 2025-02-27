import React, { useState } from 'react'
import CurrencyInput from '@/app/components/shared/CurrencyInput'
import Currencies from '@/app/components/Currencies'

const Buy = () => {
  // État pour la devise choisie
  const [selectedCurrency, setSelectedCurrency] = useState('EUR')
  // État pour la somme que l’utilisateur envoie
  const [amountToSend, setAmountToSend] = useState('10')
  // État pour afficher ou non le sélecteur de devises
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)

  // Exemple de taux de change simplifié (pour la démo seulement)
  // Dans la vraie vie, vous récupérerez ça via une API
  const exchangeRates: Record<string, number> = {
    EUR: 0.92444, // 1 EUR -> 0.92444 TGG (exemple)
    USD: 0.85,    // 1 USD -> 0.85 TGG (exemple)
    CHF: 1.02,    // 1 CHF -> 1.02 TGG (exemple)
    GBP: 1.12,    // 1 GBP -> 1.12 TGG (exemple)
    CAD: 0.70,    // 1 CAD -> 0.70 TGG (exemple)
  }

  // Conversion vers TGG selon la devise
  const handleReceiveAmount = () => {
    const rate = exchangeRates[selectedCurrency] || 1
    const numericValue = parseFloat(amountToSend) || 0
    return (numericValue * rate).toFixed(4)
  }

  return (
    <div className="p-6 w-full relative">
      {/* Bouton Bank transfer (exemple) */}
      <button className="w-full bg-blue-600 text-white py-3 rounded-xl mb-6 flex items-center justify-center gap-2 shadow-sm">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 6h18M3 12h18M3 18h18"
          />
        </svg>
        Bank transfer
      </button>

      {/* Champ de saisie pour le montant envoyé dans la devise sélectionnée */}
      <CurrencyInput
        label="YOU SEND"
        value={amountToSend}
        currency={selectedCurrency}
        onChangeValue={val => setAmountToSend(val)}
        onOpenCurrencyPicker={() => setShowCurrencyPicker(true)}
      />

      <div className="my-4" />

      {/* Affichage du montant en TGG (non sélectionnable car on reçoit toujours du TGG) */}
      <CurrencyInput
        label="YOU RECEIVE"
        value={handleReceiveAmount()}
        currency="TGG"
        isSelectable={false}
      />

      <div className="mt-6">
        <button className="w-full bg-black text-white py-3 rounded-xl font-medium shadow-sm">
          Next
        </button>
      </div>

      {/* Affichage conditionnel du sélecteur de devises (au clic sur la zone devise) */}
      {showCurrencyPicker && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/80 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl shadow-md">
            <Currencies
              onSelect={(currency) => {
                setSelectedCurrency(currency)
                setShowCurrencyPicker(false)
              }}
            />
            <button
              onClick={() => setShowCurrencyPicker(false)}
              className="mt-4 px-3 py-2 bg-gray-200 rounded text-color4"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Buy
