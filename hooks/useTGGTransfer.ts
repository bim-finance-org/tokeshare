import { useWriteContract } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { CONTRACTS } from '@/contracts/contracts';
import { TGG_ABI } from '@/contracts/abis/tgg_abi';

// Ajouter l'addresse de récupération des fees
export const TOKESHARE_TGG_RECIPIENT = "0x6f89CED516F8814729055a0A3Ac82b8D7E09370d";

export function useTGGTransfer() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const transferTGGToTokeShare = async (amount: string) => {
    const amountInWei = parseUnits(amount, 18);
    
    return writeContract({
      address: CONTRACTS.TGG as Address,
      abi: TGG_ABI,
      functionName: 'transfer',
      args: [TOKESHARE_TGG_RECIPIENT as Address, amountInWei],
    });
  };

  return {
    transferTGGToTokeShare,
    isPending,
    error,
    hash
  };
} 