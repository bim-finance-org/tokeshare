import { useWriteContract } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { CONTRACTS } from '@/contracts/contracts';
import { TGG_ABI } from '@/contracts/abis/tgg_abi';
import { useAppKitNetwork } from '@reown/appkit/react';
import { base } from '@reown/appkit/networks';

export const TOKESHARE_TFT_RECIPIENT = process.env.NEXT_PUBLIC_TOKESHARE_TFT_RECIPIENT as Address;

export function useTFTTransfer() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { switchNetwork } = useAppKitNetwork();

  const transferTFTToTokeShare = async (amount: string) => {
    const amountInWei = parseUnits(amount, 18);

    switchNetwork(base);

    return writeContract({
      address: CONTRACTS.TFT_001 as Address,
      abi: TGG_ABI,
      functionName: 'transfer',
      args: [TOKESHARE_TFT_RECIPIENT, amountInWei],
    });
  };

  return {
    transferTFTToTokeShare,
    isPending,
    error,
    hash,
  };
}
