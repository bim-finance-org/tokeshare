import { MARKETPLACE_ABI } from "@/contracts/abis/marketplace_abi";
import { CONTRACTS } from "@/contracts/contracts";
import { ERC20_ABI } from "@/contracts/abis/erc20_abi";
import { Address } from "viem";
import {
  usePublicClient,
  useWalletClient,
  useWriteContract,
  useReadContract,
  useAccount,
} from "wagmi";
import { getTokenAddress, getTokenDecimals } from "@/utils/token";
import { Blockchain } from "@/types/Blockchain";
import { TokenInfo } from "@/config/token";

export function useMarketplaceContract() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  // Vérifie le solde du token
  const checkTokenBalance = async (
    tokenAddress: Address,
    owner: Address
  ): Promise<bigint> => {
    if (!publicClient) throw new Error("Public client non disponible");

    return (await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [owner],
    })) as bigint;
  };

  // Vérifie l'allowance
  const checkAllowance = async (
    tokenAddress: Address,
    owner: Address,
    spender: Address
  ): Promise<bigint> => {
    if (!publicClient) throw new Error("Public client non disponible");

    return (await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [owner, spender],
    })) as bigint;
  };

  // Approve un token
  const approveToken = async (
    tokenAddress: Address,
    spender: Address,
    amount: bigint
  ) => {
    if (!walletClient) throw new Error("Wallet client non disponible");

    const txHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spender, amount],
    });

    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash: txHash });
    }
  };

  const buyTokenOnMarketplace = async (
    tokenSymbol: string,
    stablecoinAmount: string,
    tokenAmount: string,
    stableToPay: string
  ) => {
    if (!publicClient) throw new Error("Public client non disponible");
    if (!userAddress) throw new Error("Utilisateur non connecté");

    const stableDecimals = getTokenDecimals(stableToPay);
    const tokenDecimals = getTokenDecimals(tokenSymbol);
    if (stableDecimals === undefined || tokenDecimals === undefined) {
      throw new Error("Impossible d’obtenir les décimales des tokens");
    }

    const parsedStableAmount = parseFloat(stablecoinAmount);

    const parsedTokenAmount = parseFloat(tokenAmount);
    if (isNaN(parsedStableAmount) || isNaN(parsedTokenAmount)) {
      throw new Error("Montant invalide");
    }

    const amountStableParsed = BigInt(
      Math.floor(parsedStableAmount * 10 ** stableDecimals)
    );

    const amountTokenParsed = BigInt(
      Math.floor(parsedTokenAmount * 10 ** tokenDecimals)
    );
    console.log(amountTokenParsed);

    const stableCoinAddress = getTokenAddress(stableToPay, Blockchain.Base);
    const tokenAddress = getTokenAddress(tokenSymbol, Blockchain.Base);
    if (!stableCoinAddress || !tokenAddress) {
      throw new Error("Adresse de token introuvable");
    }

    const balance = await checkTokenBalance(stableCoinAddress, userAddress);
    if (balance < amountStableParsed) {
      throw new Error(
        `Solde insuffisant. Requis: ${amountStableParsed}, Disponible: ${balance.toString()}`
      );
    }

    const allowance = await checkAllowance(
      stableCoinAddress,
      userAddress,
      CONTRACTS.MARKETPLACE as Address
    );

    if (allowance < amountStableParsed) {
      await approveToken(
        stableCoinAddress,
        CONTRACTS.MARKETPLACE as Address,
        amountStableParsed
      );
    }

    await writeContract({
      address: CONTRACTS.MARKETPLACE as Address,
      abi: MARKETPLACE_ABI,
      functionName: "buyTokens",
      args: [tokenAddress, amountTokenParsed, stableCoinAddress],
    });
  };

  // Récupérer les infos sur un token listé
  function getTokenInfo(token: Address) {
    return useReadContract({
      address: CONTRACTS.MARKETPLACE as Address,
      abi: MARKETPLACE_ABI,
      functionName: "getTokenInfo",
      args: [token],
      chainId: 8453,
    });
  }

  return {
    buyTokenOnMarketplace,
    getTokenInfo,
    isPending,
    error,
    hash,
    checkTokenBalance,
    checkAllowance,
    approveToken,
  };
}
