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

  // Tracks the chain we last auto-triggered a switch from. Using a ref means
  // the de-dup logic does not require state and therefore can't cascade a
  // render from inside the effect below.
  const lastAttemptedFromChainRef = useRef<number | undefined>(undefined);

  const attemptSwitch = useCallback(() => {
    if (!isConnected || !targetChainId || isOnCorrectChain) return;
    switchChain({ chainId: targetChainId });
  }, [isConnected, targetChainId, isOnCorrectChain, switchChain]);

  // Auto-attempt the switch once per (wrong) chain. If the user dismisses
  // the wallet prompt we won't loop; if they switch to a different wrong
  // chain we will try again.
  useEffect(() => {
    if (!isConnected || isOnCorrectChain || isPending) return;
    if (lastAttemptedFromChainRef.current === currentChainId) return;
    lastAttemptedFromChainRef.current = currentChainId;
    attemptSwitch();
  }, [isConnected, isOnCorrectChain, isPending, currentChainId, attemptSwitch]);

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
    lastAttemptedFromChainRef.current = undefined;
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
