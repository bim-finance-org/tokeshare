import { CONTRACTS, getTGGContracts } from '@/contracts/contracts';
import { useZAPContract } from './useContracts';
import { Address, parseUnits } from 'viem';
import { usePublicClient, useWalletClient, useReadContract } from 'wagmi';
import { RouteParams } from '@/interfaces/RouteParams';
import { RouteSummary } from '@/interfaces/RouteSummary';
import { BuildRouteParams } from '@/interfaces/BuildRouteParams';
import { BuildRouteResponse } from '@/interfaces/BuildRouteResponse';
import { ERC20_ABI } from '@/contracts/abis/erc20_abi';
import { ZAP_ABI } from '@/contracts/abis/zap_abi';
import { getTokenDecimals } from '@/utils/tokenUtils';
import { useMemo } from 'react';
import { Blockchain } from '@/enums/Blockchain';

const KYBERSWAP_CHAIN_SLUGS: Record<Blockchain, string> = {
  [Blockchain.Polygon]: 'polygon',
  [Blockchain.Base]: 'base',
  [Blockchain.Ethereum]: 'ethereum',
};

// Hook React pour lire les fees du contrat ZAP de manière réactive
export const useZapFees = () => {
  const {
    data: zapMintFeeRaw,
    isLoading: isLoadingMintFee,
    error: mintFeeError,
  } = useReadContract({
    address: CONTRACTS.ZAP as Address,
    abi: ZAP_ABI,
    functionName: 'zapMintFee',
  });

  const {
    data: zapWithdrawFeeRaw,
    isLoading: isLoadingWithdrawFee,
    error: withdrawFeeError,
  } = useReadContract({
    address: CONTRACTS.ZAP as Address,
    abi: ZAP_ABI,
    functionName: 'zapWithdrawFee',
  });

  const zapMintFee = zapMintFeeRaw ? Number(zapMintFeeRaw) / 100 : 0; // Convertir en pourcentage
  const zapWithdrawFee = zapWithdrawFeeRaw ? Number(zapWithdrawFeeRaw) / 100 : 0; // Convertir en pourcentage

  return {
    zapMintFee,
    zapWithdrawFee,
    isLoading: isLoadingMintFee || isLoadingWithdrawFee,
    error: mintFeeError || withdrawFeeError,
    raw: {
      zapMintFeeRaw,
      zapWithdrawFeeRaw,
    },
  };
};

export const useSwap = () => {
  const { zapMint, zapWithdraw, isPending, error, hash } = useZAPContract();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Fonction pour vérifier le solde du token
  const checkTokenBalance = async (tokenAddress: Address, userAddress: Address): Promise<bigint> => {
    if (!publicClient) throw new Error('Public client not available');

    try {
      const balance = (await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      })) as bigint;
      return balance;
    } catch (error) {
      throw error;
    }
  };

  // Fonction pour vérifier l'allowance
  const checkAllowance = async (
    tokenAddress: Address,
    ownerAddress: Address,
    spenderAddress: Address,
  ): Promise<bigint> => {
    if (!publicClient) throw new Error('Public client not available');

    try {
      const allowance = (await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [ownerAddress, spenderAddress],
      })) as bigint;
      return allowance;
    } catch (error) {
      throw error;
    }
  };

  // Fonction pour approuver un montant
  const approveToken = async (tokenAddress: Address, spenderAddress: Address, amount: bigint): Promise<void> => {
    if (!walletClient) throw new Error('Wallet client not available');

    try {
      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress, amount],
      });

      // Attendre la confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
    } catch (error) {
      throw error;
    }
  };

  // Fonction pour lire les fees du contrat ZAP (pour usage dans les fonctions async)
  const getZapFees = async (): Promise<{
    zapMintFee: number;
    zapWithdrawFee: number;
  }> => {
    if (!publicClient) throw new Error('Public client not available');

    try {
      const [zapMintFeeRaw, zapWithdrawFeeRaw] = await Promise.all([
        publicClient.readContract({
          address: CONTRACTS.ZAP as Address,
          abi: ZAP_ABI,
          functionName: 'zapMintFee',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: CONTRACTS.ZAP as Address,
          abi: ZAP_ABI,
          functionName: 'zapWithdrawFee',
        }) as Promise<bigint>,
      ]);

      // Convertir les valeurs BigInt en pourcentage
      // Supposons que les fees sont exprimées en basis points (1% = 100, 0.5% = 50)
      const zapMintFee = Number(zapMintFeeRaw) / 10000; // Convertir en pourcentage
      const zapWithdrawFee = Number(zapWithdrawFeeRaw) / 10000; // Convertir en pourcentage

      return { zapMintFee, zapWithdrawFee };
    } catch (error) {
      throw error;
    }
  };

  const getConversion = async (params: { tggAmount: string }) => {
    try {
      const { zapWithdrawFee } = await getZapFees();

      let conversion = (parseFloat(params.tggAmount) * 10 ** 9) / 31_103_476_800;

      conversion = conversion - conversion * zapWithdrawFee;

      return conversion;
    } catch (error) {
      throw error;
    }
  };

  // FIXÉ : Endpoint correct pour l'API V1 de KyberSwap
  const getSwapRoute = async (params: RouteParams, blockchain: Blockchain = Blockchain.Polygon): Promise<RouteSummary> => {
    const queryParams = new URLSearchParams({
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      amountIn: params.amountIn,
      ...(params.saveGas && { saveGas: params.saveGas.toString() }),
      ...(params.gasInclude && { gasInclude: params.gasInclude.toString() }),
      ...(params.gasPrice && { gasPrice: params.gasPrice }),
      ...(params.slippageTolerance && {
        slippageTolerance: params.slippageTolerance.toString(),
      }),
      ...(params.chargeFeeBy && { chargeFeeBy: params.chargeFeeBy }),
      ...(params.feeAmount && { feeAmount: params.feeAmount }),
      ...(params.feeReceiver && { feeReceiver: params.feeReceiver }),
      ...(params.isInBps && { isInBps: params.isInBps.toString() }),
      excludedSources: 'kyberswap-limit-order-v2,kyberswap-limit-order',
    });

    const chainSlug = KYBERSWAP_CHAIN_SLUGS[blockchain];
    const url = `https://aggregator-api.kyberswap.com/${chainSlug}/api/v1/routes?${queryParams}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Client-Id': 'tokeshare-dapp',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.code !== 0 || !data.data?.routeSummary) {
        throw new Error(`API Error: ${data.message}`);
      }

      return data.data.routeSummary;
    } catch (error) {
      throw error;
    }
  };

  // FIXÉ : Fonction pour construire les données de swap avec l'API V1 POST
  const buildSwapData = async (params: BuildRouteParams, blockchain: Blockchain = Blockchain.Polygon): Promise<string> => {
    const chainSlug = KYBERSWAP_CHAIN_SLUGS[blockchain];
    const url = `https://aggregator-api.kyberswap.com/${chainSlug}/api/v1/route/build`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Client-Id': 'tokeshare-dapp',
        },
        body: JSON.stringify({
          routeSummary: params.routeSummary,
          sender: params.sender,
          recipient: params.recipient,
          slippageTolerance: params.slippageTolerance,
          deadline: params.deadline || Math.floor(Date.now() / 1000) + 1200, // 20 minutes par défaut
          source: params.source || 'tokeshare-dapp',
          enableGasEstimation: false,
          ...(params.permit && { permit: params.permit }),
          ...(params.ignoreCappedSlippage && {
            ignoreCappedSlippage: params.ignoreCappedSlippage,
          }),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errorText}`);
      }

      const data: BuildRouteResponse = await response.json();

      if (data.code !== 0 || !data.data?.data) {
        throw new Error(`API build error: ${data.message}`);
      }

      return data.data.data;
    } catch (error) {
      throw error;
    }
  };

  // FIXÉ : Fonction swapMint mise à jour avec vérifications
  const performSwapMint = async (params: {
    inputToken: Address;
    inputAmount: string;
    outputToken: Address;
    routerAddress: Address;
    walletAddress: Address;
    blockchain?: Blockchain;
  }) => {
    try {
      const blockchain = params.blockchain ?? Blockchain.Polygon;
      const contracts = getTGGContracts(blockchain);

      // Utiliser getTokenDecimals pour obtenir les bonnes décimales
      const decimals = getTokenDecimals(params.inputToken);
      if (decimals === undefined) {
        throw new Error(`Not available decimals for this token ${params.inputToken}`);
      }

      const amountBigInt = parseUnits(params.inputAmount, decimals);

      const balance = await checkTokenBalance(params.inputToken, params.walletAddress);
      if (balance < amountBigInt) {
        throw new Error(
          `Insufficient balance.\nRequired: ${(Number(amountBigInt) / Math.pow(10, decimals)).toString()},\nAvailable: ${(Number(balance) / Math.pow(10, decimals)).toString()}`,
        );
      }

      const currentAllowance = await checkAllowance(params.inputToken, params.walletAddress, contracts.ZAP as Address);

      // 3. Approuver si nécessaire
      if (currentAllowance < amountBigInt) {
        const approvalAmount = amountBigInt;
        await approveToken(params.inputToken, contracts.ZAP as Address, approvalAmount);
      }

      const routeSummary = await getSwapRoute(
        {
          tokenIn: params.inputToken,
          tokenOut: params.outputToken,
          amountIn: amountBigInt.toString(),
          gasInclude: true,
          slippageTolerance: 200,
        },
        blockchain,
      );

      const swapData = await buildSwapData(
        {
          routeSummary,
          sender: contracts.ZAP as Address,
          recipient: contracts.ZAP as Address,
          slippageTolerance: 200,
          source: 'tokeshare-dapp',
        },
        blockchain,
      );

      const result = await zapMint(
        params.inputToken,
        params.inputAmount,
        swapData,
        params.routerAddress,
        params.walletAddress,
      );

      return result;
    } catch (error) {
      throw error;
    }
  };

  const performSwapWithdraw = async (params: {
    amount: string;
    outputToken: Address;
    routerAddress: Address;
    walletAddress: Address;
    blockchain?: Blockchain;
  }) => {
    try {
      const blockchain = params.blockchain ?? Blockchain.Polygon;
      const contracts = getTGGContracts(blockchain);

      // 1. Vérifier les soldes TGG
      const tggBalance = await checkTokenBalance(contracts.TGG as Address, params.walletAddress);
      const tggAmountBigInt = BigInt((parseFloat(params.amount) * Math.pow(10, 18)).toString());

      if (tggBalance < tggAmountBigInt) {
        throw new Error(
          `Insufficient TGG balance. Required: ${params.amount}, Available: ${(Number(tggBalance) / Math.pow(10, 18)).toFixed(4)}`,
        );
      }

      // 2. Vérifier l'allowance TGG pour le contrat ZAP
      const currentAllowance = await checkAllowance(
        contracts.TGG as Address,
        params.walletAddress,
        contracts.ZAP as Address,
      );

      if (currentAllowance < tggAmountBigInt) {
        await approveToken(contracts.TGG as Address, contracts.ZAP as Address, tggAmountBigInt);
      }

      // 3. Obtenir la route de swap PAXG → outputToken

      const conversion = await getConversion({ tggAmount: params.amount });

      // Convertir en entier avant BigInt (Math.floor pour éviter les décimales)
      const conversionInteger = Math.floor(conversion * Math.pow(10, 18));
      const conversionBigInt = BigInt(conversionInteger);
      const paxgAmountInBaseUnits = conversionBigInt.toString();

      const routeSummary = await getSwapRoute(
        {
          tokenIn: contracts.PAXG as Address,
          tokenOut: params.outputToken,
          amountIn: paxgAmountInBaseUnits,
          gasInclude: true,
          slippageTolerance: 200,
        },
        blockchain,
      );

      // 4. Construire les données de swap automatiquement
      const swapData = await buildSwapData(
        {
          routeSummary,
          sender: contracts.ZAP as Address,
          recipient: contracts.ZAP as Address,
          slippageTolerance: 200,
          source: 'tokeshare-dapp',
        },
        blockchain,
      );

      // 5. Exécuter le zapWithdraw avec le swapData construit
      const result = await zapWithdraw(
        params.amount,
        params.outputToken,
        swapData,
        params.routerAddress,
        params.walletAddress,
      );

      return result;
    } catch (error) {
      throw error;
    }
  };

  return useMemo(
    () => ({
      swapMint: performSwapMint,
      swapWithdraw: performSwapWithdraw,
      isPending,
      error,
      hash,
      getSwapRoute,
      buildSwapData,
      checkTokenBalance,
      checkAllowance,
      approveToken,
      useZapFees,
      getZapFees,
      getConversion,
    }),
    [isPending, error, hash, walletClient, publicClient, zapMint, zapWithdraw],
  );
};
