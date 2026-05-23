import { useCallback, useMemo } from 'react';
import { parseUnits, type Abi, type Address } from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';
import { ERC20_ABI } from '@/contracts/abis/erc20_abi';
import { Blockchain } from '@/enums/Blockchain';
import { getTokenDecimals } from '@/utils/tokenUtils';
import type { RouteParams } from '@/interfaces/RouteParams';
import type { RouteSummary } from '@/interfaces/RouteSummary';
import type { BuildRouteParams } from '@/interfaces/BuildRouteParams';
import type { BuildRouteResponse } from '@/interfaces/BuildRouteResponse';

const KYBERSWAP_CHAIN_SLUGS: Record<Blockchain, string> = {
  [Blockchain.Polygon]: 'polygon',
  [Blockchain.Base]: 'base',
  [Blockchain.Ethereum]: 'ethereum',
};

const KYBERSWAP_EXCLUDED_SOURCES =
  'kyberswap-limit-order-v2,kyberswap-limit-order,kyberswap-pmm,kyber-pmm,hashflow-v3,bebop,clipper,native-v1,native-v2';

export type ResolvedZapContracts = {
  zap: Address;
  baseToken: Address;
  paymentToken: Address;
  /** Override the default chain slug derived from the blockchain. */
  kyberChain?: string;
};

export type ZapContractHook = {
  zapMint: (
    inputToken: Address,
    inputAmount: string,
    swapData: string,
    swapTarget: Address,
    receiver: Address,
    blockchain?: Blockchain,
    ethValue?: string,
  ) => Promise<unknown>;
  zapWithdraw: (
    tokenAmount: string,
    outputToken: Address,
    swapData: string,
    swapTarget: Address,
    receiver: Address,
    blockchain?: Blockchain,
  ) => Promise<unknown>;
  isPending: boolean;
  error: Error | null;
  hash: `0x${string}` | undefined;
};

export interface UseZapSwapConfig {
  /** Result of useZAPContract / useZAPTMCContract / useZAPTSP500Contract. */
  zap: ZapContractHook;
  /** ABI used to read zapMintFee / zapWithdrawFee on the variant. */
  abi: readonly unknown[];
  /** Resolve the contract bundle for a given chain. */
  resolveContracts: (blockchain: Blockchain) => ResolvedZapContracts;
  /** Default blockchain if the call site doesn't pass one. */
  defaultBlockchain: Blockchain;
  /**
   * Convert a base-token amount (TGG/TMC/TSP500) into the equivalent payment-token amount
   * (PAXG/CMC20/DESPXA) after applying the withdraw fee. Each variant has its own ratio.
   */
  computeWithdrawAmount: (amount: string, withdrawFee: number) => number;
}

export type ZapSwapMintParams = {
  inputToken: Address;
  inputAmount: string;
  outputToken: Address;
  routerAddress: Address;
  walletAddress: Address;
  blockchain?: Blockchain;
};

export type ZapSwapWithdrawParams = {
  amount: string;
  outputToken: Address;
  routerAddress: Address;
  walletAddress: Address;
  blockchain?: Blockchain;
};

export function useZapSwap(config: UseZapSwapConfig) {
  const { zap, abi, resolveContracts, defaultBlockchain, computeWithdrawAmount } = config;
  const { zapMint, zapWithdraw, isPending, error, hash } = zap;
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
      const { zap: zapAddress } = resolveContracts(blockchain);
      const [zapMintFeeRaw, zapWithdrawFeeRaw] = await Promise.all([
        publicClient.readContract({
          address: zapAddress,
          abi: abi as Abi,
          functionName: 'zapMintFee',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: zapAddress,
          abi: abi as Abi,
          functionName: 'zapWithdrawFee',
        }) as Promise<bigint>,
      ]);
      return {
        zapMintFee: Number(zapMintFeeRaw) / 10000,
        zapWithdrawFee: Number(zapWithdrawFeeRaw) / 10000,
      };
    },
    [publicClient, abi, resolveContracts],
  );

  const getConversion = useCallback(
    async (params: { amount: string; blockchain: Blockchain }): Promise<number> => {
      const { zapWithdrawFee } = await getZapFees(params.blockchain);
      return computeWithdrawAmount(params.amount, zapWithdrawFee);
    },
    [getZapFees, computeWithdrawAmount],
  );

  const getSwapRoute = useCallback(
    async (params: RouteParams, blockchain: Blockchain = defaultBlockchain): Promise<RouteSummary> => {
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
        excludedSources: KYBERSWAP_EXCLUDED_SOURCES,
      });

      const chainSlug = resolveContracts(blockchain).kyberChain ?? KYBERSWAP_CHAIN_SLUGS[blockchain];
      const url = `https://aggregator-api.kyberswap.com/${chainSlug}/api/v1/routes?${queryParams}`;

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
    },
    [resolveContracts, defaultBlockchain],
  );

  const buildSwapData = useCallback(
    async (params: BuildRouteParams, blockchain: Blockchain = defaultBlockchain): Promise<string> => {
      const chainSlug = resolveContracts(blockchain).kyberChain ?? KYBERSWAP_CHAIN_SLUGS[blockchain];
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
    [resolveContracts, defaultBlockchain],
  );

  const swapMint = useCallback(
    async (params: ZapSwapMintParams) => {
      const blockchain = params.blockchain ?? defaultBlockchain;
      const contracts = resolveContracts(blockchain);

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

      const currentAllowance = await checkAllowance(params.inputToken, params.walletAddress, contracts.zap);
      if (currentAllowance < amountBigInt) {
        // USDT on Ethereum reverts if approve() is called with a non-zero amount
        // while the existing allowance is non-zero — reset to 0 first.
        if (currentAllowance > 0n) {
          await approveToken(params.inputToken, contracts.zap, 0n);
        }
        await approveToken(params.inputToken, contracts.zap, amountBigInt);
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
          sender: contracts.zap,
          recipient: contracts.zap,
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
    [
      checkTokenBalance,
      checkAllowance,
      approveToken,
      getSwapRoute,
      buildSwapData,
      zapMint,
      resolveContracts,
      defaultBlockchain,
    ],
  );

  const swapWithdraw = useCallback(
    async (params: ZapSwapWithdrawParams) => {
      const blockchain = params.blockchain ?? defaultBlockchain;
      const contracts = resolveContracts(blockchain);

      const baseBalance = await checkTokenBalance(contracts.baseToken, params.walletAddress);
      const baseAmountBigInt = BigInt((parseFloat(params.amount) * Math.pow(10, 18)).toString());
      if (baseBalance < baseAmountBigInt) {
        throw new Error(
          `Insufficient balance. Required: ${params.amount}, Available: ${(Number(baseBalance) / Math.pow(10, 18)).toFixed(4)}`,
        );
      }

      const currentAllowance = await checkAllowance(contracts.baseToken, params.walletAddress, contracts.zap);
      if (currentAllowance < baseAmountBigInt) {
        await approveToken(contracts.baseToken, contracts.zap, baseAmountBigInt);
      }

      const conversion = await getConversion({ amount: params.amount, blockchain });
      const paymentAmount = BigInt(Math.floor(conversion * Math.pow(10, 18))).toString();

      const routeSummary = await getSwapRoute(
        {
          tokenIn: contracts.paymentToken,
          tokenOut: params.outputToken,
          amountIn: paymentAmount,
          gasInclude: true,
          slippageTolerance: 200,
        },
        blockchain,
      );

      const swapData = await buildSwapData(
        {
          routeSummary,
          sender: contracts.zap,
          recipient: contracts.zap,
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
    [
      checkTokenBalance,
      checkAllowance,
      approveToken,
      getConversion,
      getSwapRoute,
      buildSwapData,
      zapWithdraw,
      resolveContracts,
      defaultBlockchain,
    ],
  );

  return useMemo(
    () => ({
      swapMint,
      swapWithdraw,
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
      swapMint,
      swapWithdraw,
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
}
