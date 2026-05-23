import { BASE_CONTRACTS } from '@/contracts/contracts';
import { useZAPTMCContract } from './useContracts';
import { Address, parseUnits } from 'viem';
import { usePublicClient, useWalletClient, useReadContract } from 'wagmi';
import { RouteParams } from '@/interfaces/RouteParams';
import { RouteSummary } from '@/interfaces/RouteSummary';
import { BuildRouteParams } from '@/interfaces/BuildRouteParams';
import { BuildRouteResponse } from '@/interfaces/BuildRouteResponse';
import { ERC20_ABI } from '@/contracts/abis/erc20_abi';
import { ZAP_TMC_ABI } from '@/contracts/abis/zap_tmc_abi';
import { getTokenDecimals } from '@/utils/tokenUtils';
import { useCallback, useMemo } from 'react';

// TMC to CMC20 ratio: 1 TMC = 1/10 CMC20
export const TMC_CMC20_RATIO = 10;

export const useZapTmcFees = () => {
  const {
    data: zapMintFeeRaw,
    isLoading: isLoadingMintFee,
    error: mintFeeError,
  } = useReadContract({
    address: BASE_CONTRACTS.ZAP_TMC as Address,
    abi: ZAP_TMC_ABI,
    functionName: 'zapMintFee',
  });

  const {
    data: zapWithdrawFeeRaw,
    isLoading: isLoadingWithdrawFee,
    error: withdrawFeeError,
  } = useReadContract({
    address: BASE_CONTRACTS.ZAP_TMC as Address,
    abi: ZAP_TMC_ABI,
    functionName: 'zapWithdrawFee',
  });

  const zapMintFee = zapMintFeeRaw ? Number(zapMintFeeRaw) / 100 : 0;
  const zapWithdrawFee = zapWithdrawFeeRaw ? Number(zapWithdrawFeeRaw) / 100 : 0;

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

export const useTmcSwap = () => {
  const { zapMint, zapWithdraw, isPending, error, hash } = useZAPTMCContract();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const checkTokenBalance = useCallback(
    async (tokenAddress: Address, userAddress: Address): Promise<bigint> => {
      if (!publicClient) throw new Error('Public client not available');
      return (await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      })) as bigint;
    },
    [publicClient],
  );

  const checkAllowance = useCallback(
    async (tokenAddress: Address, ownerAddress: Address, spenderAddress: Address): Promise<bigint> => {
      if (!publicClient) throw new Error('Public client not available');
      return (await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [ownerAddress, spenderAddress],
      })) as bigint;
    },
    [publicClient],
  );

  const approveToken = useCallback(
    async (tokenAddress: Address, spenderAddress: Address, amount: bigint): Promise<void> => {
      if (!walletClient) throw new Error('Wallet client not available');
      const txHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress, amount],
      });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }
    },
    [walletClient, publicClient],
  );

  const getZapFees = useCallback(async (): Promise<{ zapMintFee: number; zapWithdrawFee: number }> => {
    if (!publicClient) throw new Error('Public client not available');
    const [zapMintFeeRaw, zapWithdrawFeeRaw] = await Promise.all([
      publicClient.readContract({
        address: BASE_CONTRACTS.ZAP_TMC as Address,
        abi: ZAP_TMC_ABI,
        functionName: 'zapMintFee',
      }) as Promise<bigint>,
      publicClient.readContract({
        address: BASE_CONTRACTS.ZAP_TMC as Address,
        abi: ZAP_TMC_ABI,
        functionName: 'zapWithdrawFee',
      }) as Promise<bigint>,
    ]);
    return {
      zapMintFee: Number(zapMintFeeRaw) / 10000,
      zapWithdrawFee: Number(zapWithdrawFeeRaw) / 10000,
    };
  }, [publicClient]);

  // Convert TMC amount to CMC20 amount (1 TMC = 1/10 CMC20)
  const getConversion = useCallback(
    async (params: { tmcAmount: string }) => {
      const { zapWithdrawFee } = await getZapFees();
      let conversion = parseFloat(params.tmcAmount) / TMC_CMC20_RATIO;
      conversion = conversion - conversion * zapWithdrawFee;
      return conversion;
    },
    [getZapFees],
  );

  // KyberSwap API for Base network
  const getSwapRoute = useCallback(async (params: RouteParams): Promise<RouteSummary> => {
    const queryParams = new URLSearchParams({
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      amountIn: params.amountIn,
      ...(params.saveGas && { saveGas: params.saveGas.toString() }),
      ...(params.gasInclude && { gasInclude: params.gasInclude.toString() }),
      ...(params.gasPrice && { gasPrice: params.gasPrice }),
      ...(params.slippageTolerance && { slippageTolerance: params.slippageTolerance.toString() }),
      ...(params.chargeFeeBy && { chargeFeeBy: params.chargeFeeBy }),
      ...(params.feeAmount && { feeAmount: params.feeAmount }),
      ...(params.feeReceiver && { feeReceiver: params.feeReceiver }),
      ...(params.isInBps && { isInBps: params.isInBps.toString() }),
      excludedSources:
        'kyberswap-limit-order-v2,kyberswap-limit-order,kyberswap-pmm,kyber-pmm,hashflow-v3,bebop,clipper,native-v1,native-v2',
    });

    const url = `https://aggregator-api.kyberswap.com/base/api/v1/routes?${queryParams}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json', 'X-Client-Id': 'tokeshare-dapp' },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    if (data.code !== 0 || !data.data?.routeSummary) {
      throw new Error(`API Error: ${data.message}`);
    }
    return data.data.routeSummary;
  }, []);

  const buildSwapData = useCallback(async (params: BuildRouteParams): Promise<string> => {
    const url = 'https://aggregator-api.kyberswap.com/base/api/v1/route/build';
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
        deadline: params.deadline || Math.floor(Date.now() / 1000) + 1200,
        source: params.source || 'tokeshare-dapp',
        enableGasEstimation: false,
        ...(params.permit && { permit: params.permit }),
        ...(params.ignoreCappedSlippage && { ignoreCappedSlippage: params.ignoreCappedSlippage }),
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
  }, []);

  const performSwapMint = useCallback(
    async (params: {
      inputToken: Address;
      inputAmount: string;
      outputToken: Address;
      routerAddress: Address;
      walletAddress: Address;
    }) => {
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

      const currentAllowance = await checkAllowance(
        params.inputToken,
        params.walletAddress,
        BASE_CONTRACTS.ZAP_TMC as Address,
      );
      if (currentAllowance < amountBigInt) {
        await approveToken(params.inputToken, BASE_CONTRACTS.ZAP_TMC as Address, amountBigInt);
      }

      const routeSummary = await getSwapRoute({
        tokenIn: params.inputToken,
        tokenOut: params.outputToken,
        amountIn: amountBigInt.toString(),
        gasInclude: true,
        slippageTolerance: 200,
      });

      const swapData = await buildSwapData({
        routeSummary,
        sender: BASE_CONTRACTS.ZAP_TMC as Address,
        recipient: BASE_CONTRACTS.ZAP_TMC as Address,
        slippageTolerance: 200,
        source: 'tokeshare-dapp',
      });

      return zapMint(
        params.inputToken,
        params.inputAmount,
        swapData,
        params.routerAddress,
        params.walletAddress,
      );
    },
    [checkTokenBalance, checkAllowance, approveToken, getSwapRoute, buildSwapData, zapMint],
  );

  const performSwapWithdraw = useCallback(
    async (params: {
      amount: string;
      outputToken: Address;
      routerAddress: Address;
      walletAddress: Address;
    }) => {
      const tmcBalance = await checkTokenBalance(BASE_CONTRACTS.TMC as Address, params.walletAddress);
      const tmcAmountBigInt = BigInt((parseFloat(params.amount) * Math.pow(10, 18)).toString());
      if (tmcBalance < tmcAmountBigInt) {
        throw new Error(
          `Insufficient TMC balance. Required: ${params.amount}, Available: ${(Number(tmcBalance) / Math.pow(10, 18)).toFixed(4)}`,
        );
      }

      const currentAllowance = await checkAllowance(
        BASE_CONTRACTS.TMC as Address,
        params.walletAddress,
        BASE_CONTRACTS.ZAP_TMC as Address,
      );
      if (currentAllowance < tmcAmountBigInt) {
        await approveToken(BASE_CONTRACTS.TMC as Address, BASE_CONTRACTS.ZAP_TMC as Address, tmcAmountBigInt);
      }

      const conversion = await getConversion({ tmcAmount: params.amount });
      const conversionInteger = Math.floor(conversion * Math.pow(10, 18));
      const cmc20AmountInBaseUnits = BigInt(conversionInteger).toString();

      const routeSummary = await getSwapRoute({
        tokenIn: BASE_CONTRACTS.CMC20 as Address,
        tokenOut: params.outputToken,
        amountIn: cmc20AmountInBaseUnits,
        gasInclude: true,
        slippageTolerance: 200,
      });

      const swapData = await buildSwapData({
        routeSummary,
        sender: BASE_CONTRACTS.ZAP_TMC as Address,
        recipient: BASE_CONTRACTS.ZAP_TMC as Address,
        slippageTolerance: 200,
        source: 'tokeshare-dapp',
      });

      return zapWithdraw(
        params.amount,
        params.outputToken,
        swapData,
        params.routerAddress,
        params.walletAddress,
      );
    },
    [checkTokenBalance, checkAllowance, approveToken, getConversion, getSwapRoute, buildSwapData, zapWithdraw],
  );

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
      useZapTmcFees,
      getZapFees,
      getConversion,
    }),
    [
      performSwapMint,
      performSwapWithdraw,
      isPending,
      error,
      hash,
      getSwapRoute,
      buildSwapData,
      checkTokenBalance,
      checkAllowance,
      approveToken,
      getZapFees,
      getConversion,
    ],
  );
};
