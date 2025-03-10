import React from 'react';
import { useAccount } from 'wagmi';

interface ConnectButtonProps {
  connectText?: string;
  connectedText?: string;
  className?: string;
  showAddress?: boolean;
  onConnectedClick?: () => void;
}

const ConnectButton = ({ 
  connectText = 'Connect Wallet',
  connectedText,
  className = "w-full bg-color4 text-white py-3 rounded-xl font-medium transform transition-all duration-200 hover:bg-opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg",
  showAddress = false,
  onConnectedClick
}: ConnectButtonProps) => {
  const { address } = useAccount();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const buttonText = address 
    ? (connectedText || (showAddress && address ? formatAddress(address) : 'Connected'))
    : connectText;

  return (
    <div className={className} onClick={address ? onConnectedClick : undefined}>
      <w3m-connect-button
        label={buttonText}
        size="md"
        custom-class="w-full py-2 font-medium text-white"
      />
    </div>
  );
};

export default ConnectButton; 