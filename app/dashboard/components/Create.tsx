import React, { useState } from 'react'

const Create = () => {
  const [showPrefilled, setShowPrefilled] = useState(false)
  const [formData, setFormData] = useState({
    id: '',
    payReference: '',
    type: 'buy',
    inputType: 'EUR',
    receivedAmount: '',
    outputType: '',
    walletAddress: '',
    firstName: '',
    lastName: '',
    email: '',
    language: 'fr',
    sentAmount: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Ici, vous pouvez ajouter la logique pour traiter les données du formulaire
    console.log(formData)
    // Réinitialisation du formulaire
    setFormData({
      id: '',
      payReference: '',
      type: 'buy',
      inputType: 'EUR',
      receivedAmount: '',
      outputType: '',
      walletAddress: '',
      firstName: '',
      lastName: '',
      email: '',
      language: 'fr',
      sentAmount: ''
    })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center mb-6">
          <input
            type="checkbox"
            id="showPrefilled"
            checked={showPrefilled}
            onChange={(e) => setShowPrefilled(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="showPrefilled" className="ml-2 block text-sm text-gray-900">
            Afficher les champs pré-remplis
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="id" className="block text-sm font-medium text-gray-700">ID</label>
            <input
              type="text"
              id="id"
              name="id"
              value={formData.id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="payReference" className="block text-sm font-medium text-gray-700">Pay Reference</label>
            <input
              type="text"
              id="payReference"
              name="payReference"
              value={formData.payReference}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>

          <div>
            <label htmlFor="inputType" className="block text-sm font-medium text-gray-700">Type d'entrée</label>
            <select
              id="inputType"
              name="inputType"
              value={formData.inputType}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="EUR">EUR</option>
              <option value="ETH">ETH</option>
            </select>
          </div>

          <div>
            <label htmlFor="receivedAmount" className="block text-sm font-medium text-gray-700">Montant reçu</label>
            <input
              type="number"
              id="receivedAmount"
              name="receivedAmount"
              value={formData.receivedAmount}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="outputType" className="block text-sm font-medium text-gray-700">Type de sortie</label>
            <input
              type="text"
              id="outputType"
              name="outputType"
              value={formData.outputType}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700">Adresse du wallet</label>
            <input
              type="text"
              id="walletAddress"
              name="walletAddress"
              value={formData.walletAddress}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Prénom</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Langage</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, language: 'fr' }))}
                className={`px-4 py-2 rounded-md ${
                  formData.language === 'fr' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, language: 'en' }))}
                className={`px-4 py-2 rounded-md ${
                  formData.language === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, language: 'es' }))}
                className={`px-4 py-2 rounded-md ${
                  formData.language === 'es' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                ES
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="sentAmount" className="block text-sm font-medium text-gray-700">Montant envoyé</label>
            <input
              type="number"
              id="sentAmount"
              name="sentAmount"
              value={formData.sentAmount}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Valider
          </button>
        </div>
      </form>
    </div>
  )
}

export default Create