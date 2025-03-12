// components/ConnectWalletButton.jsx
import React from 'react';
import { useAppKit } from '@reown/appkit/react';
import { useAppKitAccount } from '@reown/appkit/react';

type ConnectWalletButtonProps = {
  isTransparent?: boolean;
  navbarButton?: boolean;
};

const ConnectWalletButton = ({isTransparent = false, navbarButton = false}: ConnectWalletButtonProps) => {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  
  // Format address to show first 6 and last 4 characters
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };
  
  const handleConnect = async () => {
    try {
      // Open the AppKit modal to connect wallet
      open({ view: isConnected ? 'Account' : 'Connect' });
    } catch (error) {
      console.error("Erreur de connexion :", error);
      // Gérez l'erreur, par exemple avec un message d'alerte
    }
  };

  // Determine button text based on connection status
  const buttonText = isConnected 
    ? (navbarButton ? formatAddress(address || '') : formatAddress(address || ''))
    : (navbarButton ? 'My Account' : 'Connect Wallet');

  return (
    <button
      onClick={handleConnect}
      style={{
        backgroundColor: isTransparent ? 'transparent' : 'hsl(var(--color4))',
        color: '#fff',
        border: isTransparent ? 'white solid 2px' : 'none',
        borderRadius: '8px',
        padding: '12px 24px',
        fontSize: '16px',
        cursor: 'pointer',
        width: '100%',
        height: '100%',
      }}
    >
      {buttonText}
    </button>
  );
};

export default ConnectWalletButton;
