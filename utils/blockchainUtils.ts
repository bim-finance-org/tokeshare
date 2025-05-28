import { useAccount, useBalance } from 'wagmi';
import { parseEther, Address } from 'viem';
import { useReadContracts } from 'wagmi';

type TokenInfo = {
  address: string;
  decimals: number;
};

type TokenAddresses = {
  [key: string]: TokenInfo;
};

type BlockchainAddresses = {
  [key: string]: TokenAddresses;
};

// Token contract addresses for different blockchains
const TOKEN_ADDRESSES: BlockchainAddresses = {
  Polygon: {
    TGG: { address: '0x...', decimals: 18 }, // Replace with actual TGG token address on Polygon
    USDT: { address: '0x1E4a5963aBFD975d8c9021ce480b42188849D41d', decimals: 6 },
    USDC: { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
    DAI: { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 },
    EURS: { address: '0xE111178A87A3BFf0c8d18DECBa5798827539Ae99', decimals: 2 },
    CRVUSD: { address: '0x...', decimals: 18 }, // Replace with actual CRVUSD token address on Polygon
    EURA: { address: '', decimals: 18 },
    USDCE: { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 }, // Same as USDC on Polygon
  },
  Base: {
    // TGG: { address: '0x...', decimals: 18 }, // Replace with actual TGG token address on Base
    // USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    // DAI: { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18 },
    // CRVUSD: { address: '0x...', decimals: 18 }, // Replace with actual CRVUSD token address on Base
    // EURC: { address: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42', decimals: 6 },
    // BOLD: { address: '0x...', decimals: 18 }, // Replace with actual BOLD token address on Base
  }
};

// ABI minimal pour balanceOf
const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
] as const;

// Hook pour récupérer toutes les balances d'une blockchain en une fois
export const useAllTokenBalances = (blockchain: string) => {
  const { address } = useAccount();
  const tokens = TOKEN_ADDRESSES[blockchain] || {};
  
  // Préparer les contrats pour multicall - seulement les tokens avec des adresses valides
  const validTokens = Object.entries(tokens).filter(([_, tokenInfo]) => 
    tokenInfo.address && tokenInfo.address !== '0x...'
  );
  
  const contracts = validTokens.map(([symbol, tokenInfo]) => ({
    address: tokenInfo.address as Address,
    abi: ERC20_BALANCE_ABI,
    functionName: 'balanceOf',
    args: [address],
  }));

  const { data: balances, isLoading, error } = useReadContracts({
    contracts,
    query: {
      enabled: !!address && contracts.length > 0,
    },
  });

  // Formater les résultats avec le bon mapping
  const formattedBalances = validTokens.reduce((acc, [symbol, tokenInfo], index) => {
    const balance = balances?.[index];
    const rawBalance = balance?.result || BigInt(0);
    const decimals = tokenInfo.decimals;
    const formattedBalance = rawBalance ? (Number(rawBalance) / Math.pow(10, decimals)).toFixed(6) : '0';
    
    acc[symbol] = {
      raw: rawBalance,
      formatted: formattedBalance,
      address: tokenInfo.address,
      decimals: decimals,
    };
    
    return acc;
  }, {} as Record<string, { raw: bigint; formatted: string; address: string; decimals: number }>);

  return {
    balances: formattedBalances,
    isLoading,
    error,
  };
};

// Hook original pour un seul token (gardé pour compatibilité)
export const useTokenBalance = (currency: string, blockchain: string) => {
  const { address } = useAccount();
  const tokenInfo = TOKEN_ADDRESSES[blockchain]?.[currency];

  const { data: balance } = useBalance({
    address,
    token: tokenInfo?.address ? tokenInfo.address as `0x${string}` : undefined,
  });

  return balance?.formatted || '0';
};

// Hook pour récupérer les balances de tokens spécifiques
export const useMultipleTokenBalances = (tokens: string[], blockchain: string) => {
  const { address } = useAccount();
  const tokenAddresses = TOKEN_ADDRESSES[blockchain] || {};
  
  const validTokens = tokens.filter(token => 
    tokenAddresses[token] && tokenAddresses[token].address !== '0x...'
  );
  
  const contracts = validTokens.map(token => ({
    address: tokenAddresses[token].address as Address,
    abi: ERC20_BALANCE_ABI,
    functionName: 'balanceOf',
    args: [address],
  }));

  const { data: balances, isLoading, error } = useReadContracts({
    contracts,
    query: {
      enabled: !!address && contracts.length > 0,
    },
  });

  const formattedBalances = tokens.reduce((acc, token, index) => {
    const tokenInfo = tokenAddresses[token];
    if (tokenInfo && tokenInfo.address !== '0x...') {
      const validIndex = validTokens.indexOf(token);
      const balance = balances?.[validIndex];
      const rawBalance = balance?.result || BigInt(0);
      const decimals = tokenInfo.decimals;
      acc[token] = rawBalance ? (Number(rawBalance) / Math.pow(10, decimals)).toFixed(6) : '0';
    } else {
      acc[token] = '0';
    }
    return acc;
  }, {} as Record<string, string>);

  return {
    balances: formattedBalances,
    isLoading,
    error,
  };
}; 