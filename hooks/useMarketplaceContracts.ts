import { MARKETPLACE_ABI } from '@/contracts/abis/marketplace_abi';
import { CONTRACTS } from '@/contracts/contracts';
import { ERC20_ABI } from '@/contracts/abis/erc20_abi';
import { Address } from 'viem';
import { usePublicClient, useWalletClient, useWriteContract, useReadContract, useAccount } from 'wagmi';
import { getTokenAddress, getTokenDecimals } from '@/utils/token';
import { Blockchain } from '@/enums/Blockchain';
import { TokenInfo } from '@/config/token';
import { PUBLIC_CLIENTS } from '@/lib/clients';
import { useMemo } from 'react';

export function useMarketplaceContract() {
  const wagmiClient = usePublicClient();
  const publicClient = wagmiClient?.chain?.id === 8453 ? wagmiClient : PUBLIC_CLIENTS.Base;

  const { data: walletClient } = useWalletClient();
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const tokenAddress = getTokenAddress('TFT_001', Blockchain.Base) as Address;

  // Call useReadContract directly at the top level (not inside a function)
  const tftTokenInfoResult = useReadContract({
    address: CONTRACTS.MARKETPLACE as Address,
    abi: MARKETPLACE_ABI,
    functionName: 'getTokenInfo',
    args: [tokenAddress],
    chainId: 8453,
  });

  const tokenInfo = tftTokenInfoResult.data;

  // Vérifie le solde du token
  const checkTokenBalance = async (tokenAddress: Address, owner: Address): Promise<bigint> => {
    if (!publicClient) throw new Error('Public client non disponible');

    return (await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [owner],
    })) as bigint;
  };

  // Vérifie l'allowance
  const checkAllowance = async (tokenAddress: Address, owner: Address, spender: Address): Promise<bigint> => {
    if (!publicClient) throw new Error('Public client non disponible');

    return (await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner, spender],
    })) as bigint;
  };

  // Approve un token
  const approveToken = async (tokenAddress: Address, spender: Address, amount: bigint) => {
    if (!walletClient) throw new Error('Wallet client non disponible');

    const txHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
    });

    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash: txHash });
    }
  };

  const buyTokenOnMarketplace = async (tokenSymbol: string, tokenAmount: string, stableToPay: string) => {
    if (!publicClient) throw new Error('Public client non disponible');
    if (!userAddress) throw new Error('Utilisateur non connecté');

    const stableDecimals = getTokenDecimals(stableToPay);
    const tokenDecimals = getTokenDecimals(tokenSymbol);

    if (stableDecimals === undefined || tokenDecimals === undefined) {
      throw new Error('Impossible d’obtenir les décimales des tokens');
    }

    const parsedTokenAmount = parseFloat(tokenAmount);
    if (isNaN(parsedTokenAmount)) {
      throw new Error('Montant token invalide');
    }

    const stableCoinAddress = getTokenAddress(stableToPay, Blockchain.Base);

    if (!stableCoinAddress || !tokenAddress) {
      throw new Error('Adresse de token introuvable');
    }

    const [pricePerToken, tokenDecimalsOnChain, isActive] = (tokenInfo ?? []) as [bigint, number, boolean];

    const amountTokenParsed = BigInt(Math.floor(parsedTokenAmount * 10 ** tokenDecimals));

    const estimatedStableAmount = (parsedTokenAmount * Number(pricePerToken)) / 1e18;

    const approveAmount = BigInt(Math.floor(estimatedStableAmount * 10 ** stableDecimals));

    console.log(estimatedStableAmount);

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
  };

  function getMarketplaceBalance(token: Address): Promise<bigint> {
    if (!publicClient) throw new Error('Public client non disponible');

    return publicClient.readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [CONTRACTS.MARKETPLACE as Address],
    }) as Promise<bigint>;
  }

  return useMemo(
    () => ({
      buyTokenOnMarketplace,
      // Return TFT token info data directly instead of a function that violates hooks rules
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
    [tftTokenInfoResult.data, tftTokenInfoResult.isLoading, isPending, error, hash],
  );
}
