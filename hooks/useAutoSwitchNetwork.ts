import { useEffect, useState, useCallback } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { Blockchain } from '@/enums/Blockchain';

const CHAIN_IDS: Record<Blockchain, number> = {
  Base: 8453,
  Polygon: 137,
  Ethereum: 1,
};

type SwitchStatus = 'idle' | 'switching' | 'success' | 'wrong_network';

export function useAutoSwitchNetwork(blockchain: Blockchain) {
  const { isConnected, chainId: currentChainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [status, setStatus] = useState<SwitchStatus>('idle');

  const targetChainId = CHAIN_IDS[blockchain];

  const isOnCorrectChain = currentChainId === targetChainId;

  const attemptSwitch = useCallback(() => {
    if (!isConnected || !targetChainId || isOnCorrectChain) return;

    setStatus('switching');

    switchChain(
      { chainId: targetChainId },
      {
        onSuccess: () => {
          setStatus('success');
        },
        onError: (error) => {
          console.error('Network switch failed:', error);
          setStatus('wrong_network');
        },
      }
    );
  }, [isConnected, targetChainId, isOnCorrectChain, switchChain]);

  useEffect(() => {
    if (!isConnected) {
      setStatus('idle');
      return;
    }

    if (isOnCorrectChain) {
      setStatus('success');
      return;
    }

    attemptSwitch();
  }, [isConnected, isOnCorrectChain, attemptSwitch]);

  useEffect(() => {
    if (isOnCorrectChain && status === 'wrong_network') {
      setStatus('success');
    }
  }, [currentChainId, isOnCorrectChain, status]);

  return {
    status,
    isOnCorrectChain,
    isPending,
    currentChainId,
    targetChainId,
    retry: attemptSwitch,
  };
}
