import { useWriteContract } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { getTSGContracts } from '@/contracts/contracts';
import { TGG_ABI } from '@/contracts/abis/tgg_abi';
import { Blockchain } from '@/enums/Blockchain';

export const TOKESHARE_TSG_RECIPIENT = process.env.NEXT_PUBLIC_TOKESHARE_TSG_RECIPIENT as Address;

export function useTSGTransfer() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const transferTSGToTokeShare = async (amount: string, blockchain: Blockchain = Blockchain.Ethereum) => {
    const amountInWei = parseUnits(amount, 18);
    const contracts = getTSGContracts(blockchain);

    return writeContract({
      address: contracts.TSG as Address,
      abi: TGG_ABI,
      functionName: 'transfer',
      args: [TOKESHARE_TSG_RECIPIENT, amountInWei],
    });
  };

  return {
    transferTSGToTokeShare,
    isPending,
    error,
    hash,
  };
}
