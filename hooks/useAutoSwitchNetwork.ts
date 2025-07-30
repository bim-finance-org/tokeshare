import { useEffect } from 'react';
import { useWalletClient } from 'wagmi';
import { WalletClient } from 'viem';
import { Blockchain } from '@/enums/Blockchain';

// Mapping des chaînes à leurs IDs
const CHAIN_IDS: Record<Blockchain, number> = {
  Base: 8453,
  Polygon: 137,
};

async function switchNetwork(walletClient: WalletClient, chainId: number) {
  const currentChainId = await walletClient.getChainId();
  if (currentChainId !== chainId) {
    await walletClient.switchChain({ id: chainId });
  }
}

export function useAutoSwitchNetwork(blockchain: Blockchain) {
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (!walletClient) return;
    const chainId = CHAIN_IDS[blockchain];

    if (!chainId) {
      console.warn(`Aucun chainId défini pour la blockchain ${blockchain}`);
      return;
    }

    switchNetwork(walletClient, chainId).catch((err) => console.error('Erreur lors du changement de réseau :', err));
  }, [walletClient, blockchain]);
}
