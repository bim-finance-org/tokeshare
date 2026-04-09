import { useReadContract } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { getContractsForBlockchain } from '@/contracts/contracts';
import { TGG_ABI } from '@/contracts/abis/tgg_abi';
import { NUMBER_TO_FIXE_6 } from '@/constants/constants';
import { Blockchain } from '@/enums/Blockchain';

export function useTGGBalance(userAddress?: Address, blockchain: Blockchain = Blockchain.Polygon) {
  const TGG_DECIMALS = 18;
  const contracts = getContractsForBlockchain(blockchain);

  const {
    data: balance,
    isLoading,
    error,
  } = useReadContract({
    address: contracts.TGG as Address,
    abi: TGG_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  const checkSufficientBalance = (requiredAmount: string) => {
    if (!balance || !requiredAmount || parseFloat(requiredAmount) == 0) {
      return {
        hasSufficient: false,
        formattedBalance: '0',
        formattedRequired: requiredAmount,
        rawBalance: BigInt(0),
      };
    }

    const requiredAmountInWei = parseUnits(requiredAmount, TGG_DECIMALS);
    const balanceBigInt = balance as bigint;
    const formattedBalance = (Number(balanceBigInt) / Math.pow(10, TGG_DECIMALS)).toFixed(NUMBER_TO_FIXE_6);

    return {
      hasSufficient: balanceBigInt >= requiredAmountInWei,
      formattedBalance,
      formattedRequired: requiredAmount,
      rawBalance: balanceBigInt,
    };
  };

  return {
    balance,
    formattedBalance: balance
      ? (Number(balance as bigint) / Math.pow(10, TGG_DECIMALS)).toFixed(NUMBER_TO_FIXE_6)
      : '0',
    checkSufficientBalance,
    isLoading,
    error,
  };
}
