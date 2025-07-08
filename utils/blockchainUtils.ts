import { useAccount, useBalance } from 'wagmi';
import { parseEther, Address } from 'viem';
import { useReadContracts } from 'wagmi';
import { POLYGON_ADDRESSES } from '@/utils/addresses/polygonAddresses';
import { BASE_ADDRESSES } from '@/utils/addresses/baseAddresses';
import { ERC20_ABI } from '@/contracts/abis/erc20_abi';
import { getTokenDecimals } from '@/utils/tokenUtils';

// Token contract addresses for different blockchains
const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  Polygon: POLYGON_ADDRESSES,
  Base: BASE_ADDRESSES,
};

// Hook pour récupérer toutes les balances d'une blockchain en une fois
export const useAllTokenBalances = (blockchain: string) => {
  const { address } = useAccount();
  const tokens = TOKEN_ADDRESSES[blockchain] || {};

  // Préparer les contrats pour multicall - seulement les tokens avec des adresses valides
  const validTokens = Object.entries(tokens).filter(
    ([_, tokenAddress]) => tokenAddress && tokenAddress !== '0x...' && tokenAddress !== '',
  );

  const contracts = validTokens.map(([_, tokenAddress]) => ({
    address: tokenAddress as Address,
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

  // Formater les résultats avec les decimals préremplies
  const formattedBalances = validTokens.reduce(
    (acc, [symbol, tokenAddress], index) => {
      const balance = balances?.[index];
      const rawBalance = balance?.result || BigInt(0);
      const decimals = getTokenDecimals(tokenAddress as Address);
      const formattedBalance = rawBalance ? (Number(rawBalance) / Math.pow(10, decimals)).toFixed(6) : '0';

      acc[symbol] = {
        raw: rawBalance as bigint,
        formatted: formattedBalance,
        address: tokenAddress,
        decimals: decimals,
      };

      return acc;
    },
    {} as Record<string, { raw: bigint; formatted: string; address: string; decimals: number }>,
  );

  return {
    balances: formattedBalances,
    isLoading,
    error,
  };
};

// Hook original pour un seul token (gardé pour compatibilité)
export const useTokenBalance = (currency: string, blockchain: string) => {
  const { address } = useAccount();
  const tokenAddress = TOKEN_ADDRESSES[blockchain]?.[currency];

  const { data: balance } = useBalance({
    address,
    token: tokenAddress ? (tokenAddress as `0x${string}`) : undefined,
  });

  return balance?.formatted || '0';
};

// Hook pour récupérer les balances de tokens spécifiques
export const useMultipleTokenBalances = (tokens: string[], blockchain: string) => {
  const { address } = useAccount();
  const tokenAddresses = TOKEN_ADDRESSES[blockchain] || {};

  const validTokens = tokens.filter(
    (token) => tokenAddresses[token] && tokenAddresses[token] !== '0x...' && tokenAddresses[token] !== '',
  );

  const contracts = validTokens.map((token) => ({
    address: tokenAddresses[token] as Address,
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
    (acc, token, index) => {
      const tokenAddress = tokenAddresses[token];
      if (tokenAddress && tokenAddress !== '0x...' && tokenAddress !== '') {
        const validIndex = validTokens.indexOf(token);
        const balance = balances?.[validIndex];
        const rawBalance = balance?.result || BigInt(0);
        const decimals = getTokenDecimals(tokenAddress as Address);
        acc[token] = rawBalance ? (Number(rawBalance) / Math.pow(10, decimals)).toFixed(6) : '0';
      } else {
        acc[token] = '0';
      }
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
