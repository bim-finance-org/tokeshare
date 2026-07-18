import { useEffect } from 'react';
import { useWaitForTransactionReceipt } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';

// Query-key entities that hold on-chain balances: wagmi's useBalance /
// useReadContract(s) plus our aggregated wallet-assets query. Invalidating these
// refetches every displayed balance (CryptoBalance, MAX button, wallet assets…).
const BALANCE_QUERY_ENTITIES = new Set(['balance', 'readContract', 'readContracts', 'user-token-assets']);

/**
 * Refreshes all balance-related queries once the given transaction confirms, so
 * balances update right after a swap/transfer instead of waiting for the next
 * poll. Token-agnostic — it targets the shared wagmi balance query keys, so it
 * works for every token. No-op while `hash` is undefined.
 */
export function useRefreshBalancesOnConfirm(hash?: `0x${string}`) {
  const queryClient = useQueryClient();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!isSuccess) return;
    queryClient.invalidateQueries({
      predicate: (query) => BALANCE_QUERY_ENTITIES.has(query.queryKey?.[0] as string),
    });
  }, [isSuccess, hash, queryClient]);
}
