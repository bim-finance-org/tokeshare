import { CONTRACTS } from '@/contracts/contracts'
import { useZAPContract } from './useContracts'
import { Address } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'
import { RouteParams } from '@/interfaces/RouteParams'
import { RouteSummary } from '@/interfaces/RouteSummary'
import { BuildRouteParams } from '@/interfaces/BuildRouteParams'
import { BuildRouteResponse } from '@/interfaces/BuildRouteResponse'
import { ERC20_ABI } from '@/contracts/abis/erc20_abi'

export const useSwap = () => {
  const { zapMint, zapWithdraw, isPending, error, hash } = useZAPContract()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  // Fonction pour vérifier le solde du token
  const checkTokenBalance = async (tokenAddress: Address, userAddress: Address): Promise<bigint> => {
    if (!publicClient) throw new Error('Public client non disponible')
    
    try {
      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress]
      }) as bigint
      return balance
    } catch (error) {
      throw error
    }
  }

  // Fonction pour vérifier l'allowance
  const checkAllowance = async (
    tokenAddress: Address, 
    ownerAddress: Address, 
    spenderAddress: Address
  ): Promise<bigint> => {
    if (!publicClient) throw new Error('Public client non disponible')
    
    try {
      const allowance = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [ownerAddress, spenderAddress]
      }) as bigint
      return allowance
    } catch (error) {
      throw error
    }
  }

  // Fonction pour approuver un montant
  const approveToken = async (
    tokenAddress: Address,
    spenderAddress: Address,
    amount: bigint
  ): Promise<void> => {
    if (!walletClient) throw new Error('Wallet client non disponible')
    
    try {
      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress, amount]
      })
      
      // Attendre la confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash })
      }
    } catch (error) {
      throw error
    }
  }

  // FIXÉ : Endpoint correct pour l'API V1 de KyberSwap
  const getSwapRoute = async (params: RouteParams): Promise<RouteSummary> => {
    const queryParams = new URLSearchParams({
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      amountIn: params.amountIn,
      ...(params.saveGas && { saveGas: params.saveGas.toString() }),
      ...(params.gasInclude && { gasInclude: params.gasInclude.toString() }),
      ...(params.gasPrice && { gasPrice: params.gasPrice }),
      ...(params.slippageTolerance && { slippageTolerance: params.slippageTolerance.toString() }),
      ...(params.chargeFeeBy && { chargeFeeBy: params.chargeFeeBy }),
      ...(params.feeAmount && { feeAmount: params.feeAmount }),
      ...(params.feeReceiver && { feeReceiver: params.feeReceiver }),
      ...(params.isInBps && { isInBps: params.isInBps.toString() })
    })

    // FIXÉ : Utilisation du bon endpoint pour Polygon
    const url = `https://aggregator-api.kyberswap.com/polygon/api/v1/routes?${queryParams}`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Client-Id': 'tokeshare-dapp'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (data.code !== 0 || !data.data?.routeSummary) {
        throw new Error(`Erreur API: ${data.message || 'Réponse invalide'}`)
      }

      return data.data.routeSummary
    } catch (error) {
      throw error
    }
  }

  // FIXÉ : Fonction pour construire les données de swap avec l'API V1 POST
  const buildSwapData = async (params: BuildRouteParams): Promise<string> => {
    const url = 'https://aggregator-api.kyberswap.com/polygon/api/v1/route/build'

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Client-Id': 'tokeshare-dapp'
        },
        body: JSON.stringify({
          routeSummary: params.routeSummary,
          sender: params.sender,
          recipient: params.recipient,
          slippageTolerance: params.slippageTolerance,
          deadline: params.deadline || Math.floor(Date.now() / 1000) + 1200, // 20 minutes par défaut
          source: params.source || 'tokeshare-dapp',
          enableGasEstimation: false,
          ...(params.permit && { permit: params.permit }),
          ...(params.ignoreCappedSlippage && { ignoreCappedSlippage: params.ignoreCappedSlippage })
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`)
      }

      const data: BuildRouteResponse = await response.json()

      if (data.code !== 0 || !data.data?.data) {
        throw new Error(`Erreur build API: ${data.message || 'Données de swap manquantes'}`)
      }

      return data.data.data
    } catch (error) {
      throw error
    }
  }

  // FIXÉ : Fonction swapMint mise à jour avec vérifications
  const performSwapMint = async (params: {
    inputToken: Address
    inputAmount: string
    outputToken: Address
    routerAddress: Address
    walletAddress: Address
  }) => {
    try {
      // FIXÉ : Convertir le montant en unités de base pour l'API KyberSwap
      const decimals = params.inputToken.toLowerCase() === "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359" ? 6 : 18 // USDC = 6 décimales
      const amountInBaseUnits = (parseFloat(params.inputAmount) * Math.pow(10, decimals)).toString()
      
      const amountBigInt = BigInt(amountInBaseUnits)
      
      const balance = await checkTokenBalance(params.inputToken, params.walletAddress)
      
      if (balance < amountBigInt) {
        throw new Error(`Solde insuffisant. Requis: ${amountInBaseUnits}, Disponible: ${balance.toString()}`)
      }

      const currentAllowance = await checkAllowance(
        params.inputToken,
        params.walletAddress,
        params.routerAddress
      )
      
      // 3. Approuver si nécessaire
      if (currentAllowance < amountBigInt) {
        const approvalAmount = amountBigInt * BigInt(2) // 2x le montant nécessaire
        await approveToken(params.inputToken, params.routerAddress, approvalAmount)
      }

      const routeSummary = await getSwapRoute({
        tokenIn: params.inputToken,
        tokenOut: params.outputToken,
        amountIn: amountInBaseUnits, // ✅ Utiliser les unités de base pour l'API
        gasInclude: true,
        slippageTolerance: 50
      })

      const swapData = await buildSwapData({
        routeSummary,
        sender: CONTRACTS.ZAP as Address,
        recipient: CONTRACTS.ZAP as Address,
        slippageTolerance: 200,
        source: 'tokeshare-dapp'
      })

      const result = await zapMint(
        params.inputToken,
        params.inputAmount,
        swapData,
        params.routerAddress,
        params.walletAddress
      )

      return result

    } catch (error) {
      throw error
    }
  }

  return {
    swapMint: performSwapMint,
    swapWithdraw: zapWithdraw,
    isPending,
    error,
    hash,
    getSwapRoute,
    buildSwapData,
    checkTokenBalance,
    checkAllowance,
    approveToken
  }
}
