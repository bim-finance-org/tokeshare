import { useWriteContract } from 'wagmi'
import { parseUnits, Address } from 'viem'
import { CONTRACTS } from '@/contracts/contracts'
import { ZAP_ABI } from '@/contracts/abis/zap_abi'
import { getTokenDecimals } from '@/utils/tokenUtils'

export function useZAPContract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const zapMint = async (
    inputToken: Address,
    inputAmount: string,
    swapData: string,
    swapTarget: Address,
    receiver: Address,
    ethValue?: string
  ) => {
    const decimals = getTokenDecimals(inputToken)
    const amount = parseUnits(inputAmount, decimals)
    const value = ethValue ? parseUnits(ethValue, 18) : undefined
    return writeContract({
      address: CONTRACTS.ZAP as Address,
      abi: ZAP_ABI,
      functionName: 'zapMint',
      args: [inputToken, amount, swapData, swapTarget, receiver],
      value,
    })
  }

  const zapWithdraw = async (
    tggAmount: string,
    outputToken: Address,
    swapData: string,
    swapTarget: Address,
    receiver: Address
  ) => {
    const amount = parseUnits(tggAmount, 18)
    return writeContract({
      address: CONTRACTS.ZAP as Address,
      abi: ZAP_ABI,
      functionName: 'zapWithdraw',
      args: [amount, outputToken, swapData, swapTarget, receiver],
    })
  }

  return { zapMint, zapWithdraw, isPending, error, hash }
}