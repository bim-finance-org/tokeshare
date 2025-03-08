import { useAccount, useBalance } from 'wagmi';
import { parseEther } from 'viem';

type TokenAddresses = {
  [key: string]: string;
};

type BlockchainAddresses = {
  [key: string]: TokenAddresses;
};

// Token contract addresses for different blockchains
const TOKEN_ADDRESSES: BlockchainAddresses = {
  Polygon: {
    TGG: '0x...', // Replace with actual TGG token address on Polygon
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    EURS: '0xE111178A87A3BFf0c8d18DECBa57BEdc819F1332',
    CRVUSD: '0x...', // Replace with actual CRVUSD token address on Polygon
  },
  Base: {
    TGG: '0x...', // Replace with actual TGG token address on Base
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    CRVUSD: '0x...', // Replace with actual CRVUSD token address on Base
  }
};

export const useTokenBalance = (currency: string, blockchain: string) => {
  const { address } = useAccount();
  const tokenAddress = TOKEN_ADDRESSES[blockchain]?.[currency];

  const { data: balance } = useBalance({
    address,
    token: tokenAddress ? tokenAddress as `0x${string}` : undefined,
  });

  return balance?.formatted || '0';
}; 