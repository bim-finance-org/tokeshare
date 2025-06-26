import { useWriteContract } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { CONTRACTS } from '@/contracts/contracts';
import { TGG_ABI } from '@/contracts/abis/tgg_abi';
import { useAppKitNetwork } from "@reown/appkit/react";
import { polygon } from '@reown/appkit/networks'

export const TOKESHARE_TGG_RECIPIENT = process.env.NEXT_PUBLIC_TOKESHARE_TGG_RECIPIENT as Address;

export function useTGGTransfer() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { switchNetwork } = useAppKitNetwork();

  const transferTGGToTokeShare = async (amount: string) => {
    const amountInWei = parseUnits(amount, 18);

    switchNetwork(polygon);
    
    return writeContract({
      address: CONTRACTS.TGG as Address,
      abi: TGG_ABI,
      functionName: 'transfer',
      args: [TOKESHARE_TGG_RECIPIENT, amountInWei],
    });
  };

  return {
    transferTGGToTokeShare,
    isPending,
    error,
    hash
  };
} 