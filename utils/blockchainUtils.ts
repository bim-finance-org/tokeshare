import { useAccount, useBalance } from 'wagmi';
import { Address } from 'viem';
import { useReadContracts } from 'wagmi';
import { ERC20_ABI } from '@/contracts/abis/erc20_abi';
import { getTokenDecimals } from '@/utils/tokenUtils';
import { Blockchain } from '@/types/Blockchain';
import { getBlockchainTokens, getTokenAddress } from './token';
import { TOKENS } from '@/config/token';

// Hook pour récupérer toutes les balances d'une blockchain en une fois
export const useAllTokenBalances = (blockchain: Blockchain) => {
  const { address } = useAccount();
  const tokens = getBlockchainTokens(blockchain);

  const contracts = tokens.map((token) => ({
    address: token.addresses[blockchain] as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  }));

  const {
    data: balances,
    isLoading,
    error,
  } = useReadContracts({
    contracts,
    query: {
      enabled: !!address && contracts.length > 0,
    },
  });

  const formattedBalances = tokens.reduce(
    (acc, token, idx) => {
      const balance = balances?.[idx];
      const raw = balance?.result ? BigInt(balance.result) : BigInt(0);
      const decimals = token.decimals;
      acc[token.symbol] = {
        raw,
        formatted: raw ? (Number(raw) / Math.pow(10, decimals)).toFixed(6) : '0',
        address: token.addresses[blockchain],
        decimals,
      };
      return acc;
    },
    {} as Record<string, { raw: bigint; formatted: string; address?: string; decimals: number }>,
  );

  return {
    balances: formattedBalances,
    isLoading,
    error,
  };
};

// Hook original pour un seul token (gardé pour compatibilité)
export const useTokenBalance = (symbol: string, blockchain: Blockchain) => {
  const { address } = useAccount();
  const tokenAddress = getTokenAddress(symbol, blockchain);

  const { data: balance } = useBalance({
    address,
    token: tokenAddress,
  });

  return balance?.formatted || '0';
};

// Hook pour récupérer les balances de tokens spécifiques
export const useMultipleTokenBalances = (symbols: string[], blockchain: Blockchain) => {
  const { address } = useAccount();

  const validTokens = symbols
    .map((symbol) => TOKENS[symbol])
    .filter((token) => !!token && !!token.addresses[blockchain]);

  const contracts = validTokens.map((token) => ({
    address: token.addresses[blockchain] as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  }));

  const {
    data: balances,
    isLoading,
    error,
  } = useReadContracts({
    contracts,
    query: {
      enabled: !!address && contracts.length > 0,
    },
  });

  const formattedBalances = validTokens.reduce(
    (acc, token, idx) => {
      const balance = balances?.[idx];
      const raw = balance?.result || BigInt(0);
      acc[token.symbol] = raw ? (Number(raw) / Math.pow(10, token.decimals)).toFixed(6) : '0';
      return acc;
    },
    {} as Record<string, string>,
  );

  return {
    balances: formattedBalances,
    isLoading,
    error,
  };
};
