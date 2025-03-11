// components/ConnectWalletButton.jsx
import React from 'react';
import { useAppKit } from '@reown/appkit/react';

const ConnectWalletButton = () => {
  const { open } = useAppKit();
  
  const handleConnect = async () => {
    try {
      // Open the AppKit modal to connect wallet
      open({ view: 'Connect' });
    } catch (error) {
      console.error("Erreur de connexion :", error);
      // Gérez l'erreur, par exemple avec un message d'alerte
    }
  };

  return (
    <button
      onClick={handleConnect}
      style={{
        backgroundColor: '#0070f3', // Couleur personnalisée
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 24px',
        fontSize: '16px',
        cursor: 'pointer'
      }}
    >
      Connectez votre wallet
    </button>
  );
};

export default ConnectWalletButton;
