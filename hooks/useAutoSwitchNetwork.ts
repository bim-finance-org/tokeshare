import { useCallback, useEffect, useRef } from 'react';
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

  const targetChainId = CHAIN_IDS[blockchain];
  const isOnCorrectChain = currentChainId === targetChainId;

  // Tracks the (from → to) pair we last auto-triggered a switch for. Using a ref
  // means the de-dup logic does not require state and therefore can't cascade a
  // render from inside the effect below. Keying on the target too means a change
  // of desired chain (e.g. navigating to an Ethereum-only token) re-attempts.
  const lastAttemptedKeyRef = useRef<string | undefined>(undefined);

  const attemptSwitch = useCallback(() => {
    if (!isConnected || !targetChainId || isOnCorrectChain) return;
    switchChain({ chainId: targetChainId });
  }, [isConnected, targetChainId, isOnCorrectChain, switchChain]);

  // Auto-attempt the switch once per (wrong) from→to pair. If the user dismisses
  // the wallet prompt we won't loop; if they switch to a different wrong chain,
  // or the target chain changes, we will try again.
  useEffect(() => {
    if (!isConnected || isOnCorrectChain || isPending) return;
    const key = `${currentChainId}->${targetChainId}`;
    if (lastAttemptedKeyRef.current === key) return;
    lastAttemptedKeyRef.current = key;
    attemptSwitch();
  }, [isConnected, isOnCorrectChain, isPending, currentChainId, targetChainId, attemptSwitch]);

  // Derived status — no state mirroring of wagmi inputs.
  const status: SwitchStatus = !isConnected
    ? 'idle'
    : isOnCorrectChain
      ? 'success'
      : isPending
        ? 'switching'
        : 'wrong_network';

  // Manual retry resets the dedup gate so a click really re-attempts.
  const retry = () => {
    lastAttemptedKeyRef.current = undefined;
    attemptSwitch();
  };

  return {
    status,
    isOnCorrectChain,
    isPending,
    currentChainId,
    targetChainId,
    retry,
  };
}
