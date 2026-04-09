import { useWriteContract } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { getContractsForBlockchain } from '@/contracts/contracts';
import { TGG_ABI } from '@/contracts/abis/tgg_abi';
import { useAppKitNetwork } from '@reown/appkit/react';
import { polygon, mainnet } from '@reown/appkit/networks';
import { Blockchain } from '@/enums/Blockchain';

export const TOKESHARE_TGG_RECIPIENT = process.env.NEXT_PUBLIC_TOKESHARE_TGG_RECIPIENT as Address;

const APPKIT_NETWORKS = {
  [Blockchain.Polygon]: polygon,
  [Blockchain.Ethereum]: mainnet,
};

export function useTGGTransfer() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { switchNetwork } = useAppKitNetwork();

  const transferTGGToTokeShare = async (amount: string, blockchain: Blockchain = Blockchain.Polygon) => {
    const amountInWei = parseUnits(amount, 18);
    const contracts = getContractsForBlockchain(blockchain);
    const network = APPKIT_NETWORKS[blockchain as keyof typeof APPKIT_NETWORKS];

    if (network) {
      switchNetwork(network);
    }

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
