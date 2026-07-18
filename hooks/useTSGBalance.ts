import { useReadContract } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { getTSGContracts } from '@/contracts/contracts';
import { TGG_ABI } from '@/contracts/abis/tgg_abi';
import { NUMBER_TO_FIXE_6 } from '@/constants/constants';
import { Blockchain } from '@/enums/Blockchain';

export function useTSGBalance(userAddress?: Address, blockchain: Blockchain = Blockchain.Ethereum) {
  const TSG_DECIMALS = 18;
  const contracts = getTSGContracts(blockchain);

  const {
    data: balance,
    isLoading,
    error,
  } = useReadContract({
    address: contracts.TSG as Address,
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

    const requiredAmountInWei = parseUnits(requiredAmount, TSG_DECIMALS);
    const balanceBigInt = balance as bigint;
    const formattedBalance = (Number(balanceBigInt) / Math.pow(10, TSG_DECIMALS)).toFixed(NUMBER_TO_FIXE_6);

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
      ? (Number(balance as bigint) / Math.pow(10, TSG_DECIMALS)).toFixed(NUMBER_TO_FIXE_6)
      : '0',
    checkSufficientBalance,
    isLoading,
    error,
  };
}
