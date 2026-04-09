import { useWriteContract } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { getTGGContracts } from '@/contracts/contracts';
import { TGG_ABI } from '@/contracts/abis/tgg_abi';
import { Blockchain } from '@/enums/Blockchain';

export const TOKESHARE_TGG_RECIPIENT = process.env.NEXT_PUBLIC_TOKESHARE_TGG_RECIPIENT as Address;

export function useTGGTransfer() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const transferTGGToTokeShare = async (amount: string, blockchain: Blockchain = Blockchain.Polygon) => {
    const amountInWei = parseUnits(amount, 18);
    const contracts = getTGGContracts(blockchain);

    return writeContract({
      address: contracts.TGG as Address,
      abi: TGG_ABI,
      functionName: 'transfer',
      args: [TOKESHARE_TGG_RECIPIENT, amountInWei],
    });
  };

  return {
    transferTGGToTokeShare,
    isPending,
    error,
    hash,
  };
}
