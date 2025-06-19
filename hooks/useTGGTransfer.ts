import { useWriteContract } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { CONTRACTS } from '@/contracts/contracts';
import { TGG_ABI } from '@/contracts/abis/tgg_abi';

export function useTGGTransfer() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const transferTGGToTokeShare = async (amount: string) => {
    const amountInWei = parseUnits(amount, 18);
    
    return writeContract({
      address: CONTRACTS.TGG as Address,
      abi: TGG_ABI,
      functionName: 'transfer',
      args: [process.env.TOKESHARE_TGG_RECIPIENT as Address, amountInWei],
    });
  };

  return {
    transferTGGToTokeShare,
    isPending,
    error,
    hash
  };
} 