import { useCallback } from 'react';
import { useWriteContract } from 'wagmi';
import { parseUnits, type Abi, type Address } from 'viem';
import { BASE_CONTRACTS, getTGGContracts, getTSGContracts } from '@/contracts/contracts';
import { ZAP_ABI } from '@/contracts/abis/zap_abi';
import { ZAP_TMC_ABI } from '@/contracts/abis/zap_tmc_abi';
import { ZAP_TSP500_ABI } from '@/contracts/abis/zap_tsp500_abi';
import { getTokenDecimals } from '@/utils/tokenUtils';
import { Blockchain } from '@/enums/Blockchain';

// The ABI JSON files aren't typed as viem `Abi` literals — broaden the signature
// here and cast at the writeContract call site instead of polluting every caller.
type ZapAbi = readonly unknown[];

// `staticAddress === null` means resolve at call time from the blockchain arg (TGG).
function useZapHook(abi: ZapAbi, staticAddress: Address | null) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const zapMint = useCallback(
    async (
      inputToken: Address,
      inputAmount: string,
      swapData: string,
      swapTarget: Address,
      receiver: Address,
      blockchain?: Blockchain,
      ethValue?: string,
    ) => {
      const decimals = getTokenDecimals(inputToken);
      const amount = parseUnits(inputAmount, decimals);
      const value = ethValue ? parseUnits(ethValue, 18) : undefined;
      const address = staticAddress ?? (getTGGContracts(blockchain!).ZAP as Address);
      return writeContract({
        address,
        abi: abi as Abi,
        functionName: 'zapMint',
        args: [inputToken, amount, swapData, swapTarget, receiver],
        value,
      });
    },
    [writeContract, abi, staticAddress],
  );

  const zapWithdraw = useCallback(
    async (
      tokenAmount: string,
      outputToken: Address,
      swapData: string,
      swapTarget: Address,
      receiver: Address,
      blockchain?: Blockchain,
    ) => {
      const amount = parseUnits(tokenAmount, 18);
      const address = staticAddress ?? (getTGGContracts(blockchain!).ZAP as Address);
      return writeContract({
        address,
        abi: abi as Abi,
        functionName: 'zapWithdraw',
        args: [amount, outputToken, swapData, swapTarget, receiver],
      });
    },
    [writeContract, abi, staticAddress],
  );

  return { zapMint, zapWithdraw, isPending, error, hash };
}

export function useZAPContract() {
  return useZapHook(ZAP_ABI, null);
}

// TSG (silver) is Ethereum-only, so the ZAP address is static (unlike TGG which
// resolves per chain). The silver ZAP is deployed on Ethereum Mainnet.
export function useZAPSilverContract() {
  return useZapHook(ZAP_ABI, getTSGContracts(Blockchain.Ethereum).ZAP as Address);
}

export function useZAPTMCContract() {
  return useZapHook(ZAP_TMC_ABI, BASE_CONTRACTS.ZAP_TMC as Address);
}

export function useZAPTSP500Contract() {
  return useZapHook(ZAP_TSP500_ABI, BASE_CONTRACTS.ZAP_TSP500 as Address);
}
