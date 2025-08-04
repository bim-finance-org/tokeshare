import { useReadContract, useWriteContract } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { ERC20_ABI } from '@/contracts/abis/erc20_abi';

export function useERC20(tokenAddress: Address) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const useBalance = (userAddress: Address) => {
    return useReadContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
      query: {
        enabled: !!userAddress && !!tokenAddress,
      },
    });
  };

  const useAllowance = (owner: Address, spender: Address) => {
    return useReadContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner, spender],
      query: {
        enabled: !!owner && !!spender && !!tokenAddress,
      },
    });
  };

  const useDecimals = () => {
    return useReadContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'decimals',
      query: {
        enabled: !!tokenAddress,
      },
    });
  };

  const approve = async (spender: Address, amount: string, decimals: number = 18) => {
    const parsedAmount = parseUnits(amount, decimals);

    return writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, parsedAmount],
    });
  };

  return {
    useBalance,
    useAllowance,
    useDecimals,
    approve,
    isPending,
    error,
    hash,
  };
}
