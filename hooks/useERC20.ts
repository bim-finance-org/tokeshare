import { useReadContract, useWriteContract } from 'wagmi'
import { parseUnits, formatUnits, Address } from 'viem'
import { ERC20_ABI } from '@/contracts/abis/erc20_abi'

export function useERC20(tokenAddress: Address) {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  // Obtenir le solde d'un token pour une adresse
  const useBalance = (userAddress: Address) => {
    return useReadContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
      query: {
        enabled: !!userAddress && !!tokenAddress,
      },
    })
  }

  // Obtenir l'allowance d'un token
  const useAllowance = (owner: Address, spender: Address) => {
    return useReadContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner, spender],
      query: {
        enabled: !!owner && !!spender && !!tokenAddress,
      },
    })
  }

  // Obtenir les décimales du token
  const useDecimals = () => {
    return useReadContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'decimals',
      query: {
        enabled: !!tokenAddress,
      },
    })
  }

  // Approuver un montant
  const approve = async (spender: Address, amount: string, decimals: number = 18) => {
    const parsedAmount = parseUnits(amount, decimals)
    
    return writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, parsedAmount],
    })
  }

  // Approuver le montant maximum
  const approveMax = async (spender: Address) => {
    const maxAmount = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    
    return writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, maxAmount],
    })
  }

  return {
    useBalance,
    useAllowance,
    useDecimals,
    approve,
    approveMax,
    isPending,
    error,
    hash,
  }
} 