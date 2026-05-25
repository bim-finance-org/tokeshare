import { MARKETPLACE_ABI } from '@/contracts/abis/marketplace_abi';
import { CONTRACTS } from '@/contracts/contracts';
import { ERC20_ABI } from '@/contracts/abis/erc20_abi';
import { Address } from 'viem';
import { usePublicClient, useWalletClient, useWriteContract, useReadContract, useAccount } from 'wagmi';
import { getTokenAddress, getTokenDecimals } from '@/utils/token';
import { Blockchain } from '@/enums/Blockchain';
import { PUBLIC_CLIENTS } from '@/lib/clients';
import { useCallback, useMemo } from 'react';

export function useMarketplaceContract() {
  const wagmiClient = usePublicClient();
  const publicClient = wagmiClient?.chain?.id === 8453 ? wagmiClient : PUBLIC_CLIENTS.Base;

  const { data: walletClient } = useWalletClient();
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const tokenAddress = getTokenAddress('TFT_001', Blockchain.Base) as Address;

  const tftTokenInfoResult = useReadContract({
    address: CONTRACTS.MARKETPLACE as Address,
    abi: MARKETPLACE_ABI,
    functionName: 'getTokenInfo',
    args: [tokenAddress],
    chainId: 8453,
  });

  const tokenInfo = tftTokenInfoResult.data;

  const checkTokenBalance = useCallback(
    async (tokenAddr: Address, owner: Address): Promise<bigint> => {
      if (!publicClient) throw new Error('Public client non disponible');
      return (await publicClient.readContract({
        address: tokenAddr,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [owner],
      })) as bigint;
    },
    [publicClient],
  );

  const checkAllowance = useCallback(
    async (tokenAddr: Address, owner: Address, spender: Address): Promise<bigint> => {
      if (!publicClient) throw new Error('Public client non disponible');
      return (await publicClient.readContract({
        address: tokenAddr,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [owner, spender],
      })) as bigint;
    },
    [publicClient],
  );

  const approveToken = useCallback(
    async (tokenAddr: Address, spender: Address, amount: bigint) => {
      if (!walletClient) throw new Error('Wallet client non disponible');
      const txHash = await walletClient.writeContract({
        address: tokenAddr,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender, amount],
      });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }
    },
    [walletClient, publicClient],
  );

  const sellTokenOnMarketplace = useCallback(
    async (tokenSymbol: string, tokenAmount: string, stableToReceive: string) => {
      if (!publicClient) throw new Error('Public client non disponible');
      if (!userAddress) throw new Error('Utilisateur non connecté');

      const tokenDecimals = getTokenDecimals(tokenSymbol);
      if (tokenDecimals === undefined) throw new Error('Token decimals not found');

      const parsedTokenAmount = parseFloat(tokenAmount);
      if (isNaN(parsedTokenAmount)) throw new Error('Montant token invalide');

      const stablecoinAddress = getTokenAddress(stableToReceive, Blockchain.Base);
      if (!stablecoinAddress || !tokenAddress) throw new Error('Adresse de token introuvable');

      const amountTokenParsed = BigInt(Math.floor(parsedTokenAmount * 10 ** tokenDecimals));

      const allowance = await checkAllowance(tokenAddress, userAddress, CONTRACTS.MARKETPLACE as Address);
      if (allowance < amountTokenParsed) {
        await approveToken(tokenAddress, CONTRACTS.MARKETPLACE as Address, amountTokenParsed);
      }

      await writeContract({
        address: CONTRACTS.MARKETPLACE as Address,
        abi: MARKETPLACE_ABI,
        functionName: 'sellTokens',
        args: [tokenAddress, amountTokenParsed, stablecoinAddress],
      });
    },
    [publicClient, userAddress, tokenAddress, checkAllowance, approveToken, writeContract],
  );

  const buyTokenOnMarketplace = useCallback(
    async (tokenSymbol: string, tokenAmount: string, stableToPay: string) => {
      if (!publicClient) throw new Error('Public client non disponible');
      if (!userAddress) throw new Error('Utilisateur non connecté');

      const stableDecimals = getTokenDecimals(stableToPay);
      const tokenDecimals = getTokenDecimals(tokenSymbol);
      if (stableDecimals === undefined || tokenDecimals === undefined) {
        throw new Error('Impossible d’obtenir les décimales des tokens');
      }

      const parsedTokenAmount = parseFloat(tokenAmount);
      if (isNaN(parsedTokenAmount)) throw new Error('Montant token invalide');

      const stableCoinAddress = getTokenAddress(stableToPay, Blockchain.Base);
      if (!stableCoinAddress || !tokenAddress) throw new Error('Adresse de token introuvable');

      const [pricePerToken] = (tokenInfo ?? []) as [bigint];
      const amountTokenParsed = BigInt(Math.floor(parsedTokenAmount * 10 ** tokenDecimals));
      const estimatedStableAmount = (parsedTokenAmount * Number(pricePerToken)) / 1e18;
      const approveAmount = BigInt(Math.floor(estimatedStableAmount * 10 ** stableDecimals));

      const allowance = await checkAllowance(stableCoinAddress, userAddress, CONTRACTS.MARKETPLACE as Address);
      if (allowance < approveAmount) {
        await approveToken(stableCoinAddress, CONTRACTS.MARKETPLACE as Address, approveAmount);
      }

      await writeContract({
        address: CONTRACTS.MARKETPLACE as Address,
        abi: MARKETPLACE_ABI,
        functionName: 'buyTokens',
        args: [tokenAddress, amountTokenParsed, stableCoinAddress],
      });
    },
    [publicClient, userAddress, tokenAddress, tokenInfo, checkAllowance, approveToken, writeContract],
  );

  const getMarketplaceBalance = useCallback(
    (token: Address): Promise<bigint> => {
      if (!publicClient) throw new Error('Public client non disponible');
      return publicClient.readContract({
        address: token,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [CONTRACTS.MARKETPLACE as Address],
      }) as Promise<bigint>;
    },
    [publicClient],
  );

  return useMemo(
    () => ({
      buyTokenOnMarketplace,
      sellTokenOnMarketplace,
      tftTokenInfo: tftTokenInfoResult.data,
      tftTokenInfoLoading: tftTokenInfoResult.isLoading,
      isPending,
      error,
      hash,
      checkTokenBalance,
      checkAllowance,
      approveToken,
      getMarketplaceBalance,
    }),
    [
      buyTokenOnMarketplace,
      sellTokenOnMarketplace,
      tftTokenInfoResult.data,
      tftTokenInfoResult.isLoading,
      isPending,
      error,
      hash,
      checkTokenBalance,
      checkAllowance,
      approveToken,
      getMarketplaceBalance,
    ],
  );
}
