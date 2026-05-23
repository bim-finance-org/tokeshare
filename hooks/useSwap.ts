import { getTGGContracts } from '@/contracts/contracts';
import { useZAPContract } from './useContracts';
import { Address, parseUnits } from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';
import { RouteParams } from '@/interfaces/RouteParams';
import { RouteSummary } from '@/interfaces/RouteSummary';
import { BuildRouteParams } from '@/interfaces/BuildRouteParams';
import { BuildRouteResponse } from '@/interfaces/BuildRouteResponse';
import { ERC20_ABI } from '@/contracts/abis/erc20_abi';
import { ZAP_ABI } from '@/contracts/abis/zap_abi';
import { getTokenDecimals } from '@/utils/tokenUtils';
import { useCallback, useMemo } from 'react';
import { Blockchain } from '@/enums/Blockchain';

const KYBERSWAP_CHAIN_SLUGS: Record<Blockchain, string> = {
  [Blockchain.Polygon]: 'polygon',
  [Blockchain.Base]: 'base',
  [Blockchain.Ethereum]: 'ethereum',
};

export const useSwap = () => {
  const { zapMint, zapWithdraw, isPending, error, hash } = useZAPContract();
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

  const getZapFees = useCallback(
    async (blockchain: Blockchain): Promise<{ zapMintFee: number; zapWithdrawFee: number }> => {
      if (!publicClient) throw new Error('Public client not available');
      const zapAddress = getTGGContracts(blockchain).ZAP as Address;
      const [zapMintFeeRaw, zapWithdrawFeeRaw] = await Promise.all([
        publicClient.readContract({
          address: zapAddress,
          abi: ZAP_ABI,
          functionName: 'zapMintFee',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: zapAddress,
          abi: ZAP_ABI,
          functionName: 'zapWithdrawFee',
        }) as Promise<bigint>,
      ]);
      // Fees are expressed in basis-points-times-100 (1% = 100, 0.5% = 50)
      return {
        zapMintFee: Number(zapMintFeeRaw) / 10000,
        zapWithdrawFee: Number(zapWithdrawFeeRaw) / 10000,
      };
    },
    [publicClient],
  );

  const getConversion = useCallback(
    async (params: { tggAmount: string; blockchain: Blockchain }) => {
      const { zapWithdrawFee } = await getZapFees(params.blockchain);
      let conversion = (parseFloat(params.tggAmount) * 10 ** 9) / 31_103_476_800;
      conversion = conversion - conversion * zapWithdrawFee;
      return conversion;
    },
    [getZapFees],
  );

  const getSwapRoute = useCallback(
    async (params: RouteParams, blockchain: Blockchain = Blockchain.Polygon): Promise<RouteSummary> => {
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

      const chainSlug = KYBERSWAP_CHAIN_SLUGS[blockchain];
      const url = `https://aggregator-api.kyberswap.com/${chainSlug}/api/v1/routes?${queryParams}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json', 'X-Client-Id': 'tokeshare-dapp' },
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
    },
    [],
  );

  const buildSwapData = useCallback(
    async (params: BuildRouteParams, blockchain: Blockchain = Blockchain.Polygon): Promise<string> => {
      const chainSlug = KYBERSWAP_CHAIN_SLUGS[blockchain];
      const url = `https://aggregator-api.kyberswap.com/${chainSlug}/api/v1/route/build`;

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
    },
    [],
  );

  const performSwapMint = useCallback(
    async (params: {
      inputToken: Address;
      inputAmount: string;
      outputToken: Address;
      routerAddress: Address;
      walletAddress: Address;
      blockchain?: Blockchain;
    }) => {
      const blockchain = params.blockchain ?? Blockchain.Polygon;
      const contracts = getTGGContracts(blockchain);

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
        contracts.ZAP as Address,
      );
      if (currentAllowance < amountBigInt) {
        // USDT on Ethereum reverts if approve() is called with a non-zero amount
        // while an existing allowance is non-zero — reset to 0 first.
        if (currentAllowance > 0n) {
          await approveToken(params.inputToken, contracts.ZAP as Address, 0n);
        }
        await approveToken(params.inputToken, contracts.ZAP as Address, amountBigInt);
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

      return zapMint(
        params.inputToken,
        params.inputAmount,
        swapData,
        params.routerAddress,
        params.walletAddress,
        blockchain,
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
      blockchain?: Blockchain;
    }) => {
      const blockchain = params.blockchain ?? Blockchain.Polygon;
      const contracts = getTGGContracts(blockchain);

      const tggBalance = await checkTokenBalance(contracts.TGG as Address, params.walletAddress);
      const tggAmountBigInt = BigInt((parseFloat(params.amount) * Math.pow(10, 18)).toString());
      if (tggBalance < tggAmountBigInt) {
        throw new Error(
          `Insufficient TGG balance. Required: ${params.amount}, Available: ${(Number(tggBalance) / Math.pow(10, 18)).toFixed(4)}`,
        );
      }

      const currentAllowance = await checkAllowance(
        contracts.TGG as Address,
        params.walletAddress,
        contracts.ZAP as Address,
      );
      if (currentAllowance < tggAmountBigInt) {
        await approveToken(contracts.TGG as Address, contracts.ZAP as Address, tggAmountBigInt);
      }

      const conversion = await getConversion({ tggAmount: params.amount, blockchain });
      const conversionInteger = Math.floor(conversion * Math.pow(10, 18));
      const paxgAmountInBaseUnits = BigInt(conversionInteger).toString();

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

      return zapWithdraw(
        params.amount,
        params.outputToken,
        swapData,
        params.routerAddress,
        params.walletAddress,
        blockchain,
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
