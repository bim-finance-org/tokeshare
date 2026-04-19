import { useWriteContract } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { BASE_CONTRACTS, getTGGContracts } from '@/contracts/contracts';
import { ZAP_ABI } from '@/contracts/abis/zap_abi';
import { ZAP_TMC_ABI } from '@/contracts/abis/zap_tmc_abi';
import { ZAP_TSP500_ABI } from '@/contracts/abis/zap_tsp500_abi';
import { getTokenDecimals } from '@/utils/tokenUtils';
import { Blockchain } from '@/enums/Blockchain';

export function useZAPContract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const zapMint = async (
    inputToken: Address,
    inputAmount: string,
    swapData: string,
    swapTarget: Address,
    receiver: Address,
    blockchain: Blockchain,
    ethValue?: string,
  ) => {
    const decimals = getTokenDecimals(inputToken);
    const amount = parseUnits(inputAmount, decimals);
    const value = ethValue ? parseUnits(ethValue, 18) : undefined;
    const zapAddress = getTGGContracts(blockchain).ZAP as Address;
    return writeContract({
      address: zapAddress,
      abi: ZAP_ABI,
      functionName: 'zapMint',
      args: [inputToken, amount, swapData, swapTarget, receiver],
      value,
    });
  };

  const zapWithdraw = async (
    tggAmount: string,
    outputToken: Address,
    swapData: string,
    swapTarget: Address,
    receiver: Address,
    blockchain: Blockchain,
  ) => {
    const amount = parseUnits(tggAmount, 18);
    const zapAddress = getTGGContracts(blockchain).ZAP as Address;
    return writeContract({
      address: zapAddress,
      abi: ZAP_ABI,
      functionName: 'zapWithdraw',
      args: [amount, outputToken, swapData, swapTarget, receiver],
    });
  };

  return { zapMint, zapWithdraw, isPending, error, hash };
}

export function useZAPTMCContract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const zapMint = async (
    inputToken: Address,
    inputAmount: string,
    swapData: string,
    swapTarget: Address,
    receiver: Address,
    ethValue?: string,
  ) => {
    const decimals = getTokenDecimals(inputToken);
    const amount = parseUnits(inputAmount, decimals);
    const value = ethValue ? parseUnits(ethValue, 18) : undefined;
    return writeContract({
      address: BASE_CONTRACTS.ZAP_TMC as Address,
      abi: ZAP_TMC_ABI,
      functionName: 'zapMint',
      args: [inputToken, amount, swapData, swapTarget, receiver],
      value,
    });
  };

  const zapWithdraw = async (
    tmcAmount: string,
    outputToken: Address,
    swapData: string,
    swapTarget: Address,
    receiver: Address,
  ) => {
    const amount = parseUnits(tmcAmount, 18);
    return writeContract({
      address: BASE_CONTRACTS.ZAP_TMC as Address,
      abi: ZAP_TMC_ABI,
      functionName: 'zapWithdraw',
      args: [amount, outputToken, swapData, swapTarget, receiver],
    });
  };

  return { zapMint, zapWithdraw, isPending, error, hash };
}

export function useZAPTSP500Contract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const zapMint = async (
    inputToken: Address,
    inputAmount: string,
    swapData: string,
    swapTarget: Address,
    receiver: Address,
    ethValue?: string,
  ) => {
    const decimals = getTokenDecimals(inputToken);
    const amount = parseUnits(inputAmount, decimals);
    const value = ethValue ? parseUnits(ethValue, 18) : undefined;
    return writeContract({
      address: BASE_CONTRACTS.ZAP_TSP500 as Address,
      abi: ZAP_TSP500_ABI,
      functionName: 'zapMint',
      args: [inputToken, amount, swapData, swapTarget, receiver],
      value,
    });
  };

  const zapWithdraw = async (
    tsp500Amount: string,
    outputToken: Address,
    swapData: string,
    swapTarget: Address,
    receiver: Address,
  ) => {
    const amount = parseUnits(tsp500Amount, 18);
    return writeContract({
      address: BASE_CONTRACTS.ZAP_TSP500 as Address,
      abi: ZAP_TSP500_ABI,
      functionName: 'zapWithdraw',
      args: [amount, outputToken, swapData, swapTarget, receiver],
    });
  };

  return { zapMint, zapWithdraw, isPending, error, hash };
}
