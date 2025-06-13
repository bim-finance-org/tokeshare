import { CONTRACTS } from '@/contracts/contracts'
import { useZAPContract } from './useContracts'
import { Address } from 'viem'
import { usePublicClient, useWalletClient, useReadContract } from 'wagmi'
import { RouteParams } from '@/interfaces/RouteParams'
import { RouteSummary } from '@/interfaces/RouteSummary'
import { BuildRouteParams } from '@/interfaces/BuildRouteParams'
import { BuildRouteResponse } from '@/interfaces/BuildRouteResponse'
import { ERC20_ABI } from '@/contracts/abis/erc20_abi'
import { ZAP_ABI } from '@/contracts/abis/zap_abi'
import { getTokenDecimals } from '@/utils/tokenUtils'

// Hook React pour lire les fees du contrat ZAP de manière réactive
export const useZapFees = () => {
  const { data: zapMintFeeRaw, isLoading: isLoadingMintFee, error: mintFeeError } = useReadContract({
    address: CONTRACTS.ZAP as Address,
    abi: ZAP_ABI,
    functionName: 'zapMintFee'
  })

  const { data: zapWithdrawFeeRaw, isLoading: isLoadingWithdrawFee, error: withdrawFeeError } = useReadContract({
    address: CONTRACTS.ZAP as Address,
    abi: ZAP_ABI,
    functionName: 'zapWithdrawFee'
  })

  const zapMintFee = zapMintFeeRaw ? Number(zapMintFeeRaw) / 100 : 0 // Convertir en pourcentage
  const zapWithdrawFee = zapWithdrawFeeRaw ? Number(zapWithdrawFeeRaw) / 100 : 0 // Convertir en pourcentage

  return {
    zapMintFee,
    zapWithdrawFee,
    isLoading: isLoadingMintFee || isLoadingWithdrawFee,
    error: mintFeeError || withdrawFeeError,
    raw: {
      zapMintFeeRaw,
      zapWithdrawFeeRaw
    }
  }
}

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

  // Fonction pour lire les fees du contrat ZAP (pour usage dans les fonctions async)
  const getZapFees = async (): Promise<{ zapMintFee: number; zapWithdrawFee: number }> => {
    if (!publicClient) throw new Error('Public client non disponible')
    
    try {
      const [zapMintFeeRaw, zapWithdrawFeeRaw] = await Promise.all([
        publicClient.readContract({
          address: CONTRACTS.ZAP as Address,
          abi: ZAP_ABI,
          functionName: 'zapMintFee'
        }) as Promise<bigint>,
        publicClient.readContract({
          address: CONTRACTS.ZAP as Address,
          abi: ZAP_ABI,
          functionName: 'zapWithdrawFee'
        }) as Promise<bigint>
      ])

      // Convertir les valeurs BigInt en pourcentage 
      // Supposons que les fees sont exprimées en basis points (1% = 100, 0.5% = 50)
      const zapMintFee = Number(zapMintFeeRaw) / 10000 // Convertir en pourcentage
      const zapWithdrawFee = Number(zapWithdrawFeeRaw) / 10000 // Convertir en pourcentage

      return { zapMintFee, zapWithdrawFee }
    } catch (error) {
      console.error("❌ Erreur lors de la lecture des fees:", error)
      throw error
    }
  }

  const getConversion = async (params: {
    tggAmount: string
  }) => {
    try {
      // Lire les fees réelles du contrat ZAP
      const { zapWithdrawFee } = await getZapFees()

      console.log("zapWithdrawFee", zapWithdrawFee);

      console.log("tggAmount", params.tggAmount);
      
      // Calcul de conversion avec la vraie fee
      let conversion = (parseFloat(params.tggAmount) * 10**9 / 31_103_476_800)

      console.log("conversion", conversion);

      conversion = conversion - conversion * zapWithdrawFee  // zapWithdrawFee est déjà en pourcentage
      
      console.log('conversion after fee', conversion);

      return conversion
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
      ...(params.isInBps && { isInBps: params.isInBps.toString() }),
      excludedSources: 'kyberswap-limit-order-v2,kyberswap-limit-order'
    })

    console.log({
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
    });

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

      console.log("params", {
        routeSummary: params.routeSummary,
        sender: params.sender,
        recipient: params.recipient,
        slippageTolerance: params.slippageTolerance,
        deadline: params.deadline || Math.floor(Date.now() / 1000) + 1200, // 20 minutes par défaut
        source: params.source || 'tokeshare-dapp',
        enableGasEstimation: false,
        ...(params.permit && { permit: params.permit }),
        ...(params.ignoreCappedSlippage && { ignoreCappedSlippage: params.ignoreCappedSlippage })
      });

      

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`)
      }

      const data: BuildRouteResponse = await response.json()

      if (data.code !== 0 || !data.data?.data) {
        throw new Error(`Erreur build API: ${data.message || 'Données de swap manquantes'}`)
      }

      console.log("data.data.data", data.data.data);
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
      // Utiliser getTokenDecimals pour obtenir les bonnes décimales
      const decimals = getTokenDecimals(params.inputToken);
      if (decimals === undefined) {
        throw new Error(`Impossible de déterminer les décimales pour le token ${params.inputToken}`);
      }
      
      const amountInBaseUnits = (parseFloat(params.inputAmount) * Math.pow(10, decimals)).toString();
      if (isNaN(parseFloat(amountInBaseUnits))) {
        throw new Error(`Montant invalide: ${params.inputAmount}`);
      }
      
      const amountBigInt = BigInt(amountInBaseUnits);
      console.log("amountBigInt", amountBigInt);
      const balance = await checkTokenBalance(params.inputToken, params.walletAddress);
      if (balance < amountBigInt) {
        throw new Error(`Solde insuffisant. Requis: ${amountInBaseUnits}, Disponible: ${balance.toString()}`)
      }

      console.log("inputToken", params.inputToken);
      console.log("walletAddress", params.walletAddress);
      console.log("inputAmount", params.inputAmount);
      console.log("outputToken", params.outputToken);
      console.log("routerAddress", params.routerAddress);

      const currentAllowance = await checkAllowance(
        params.inputToken,
        params.walletAddress,
        CONTRACTS.ZAP as Address
      )
      
      // 3. Approuver si nécessaire
      if (currentAllowance < amountBigInt) {
        const approvalAmount = amountBigInt
        await approveToken(params.inputToken, CONTRACTS.ZAP as Address, approvalAmount)
      }

      const routeSummary = await getSwapRoute({
        tokenIn: params.inputToken,
        tokenOut: params.outputToken,
        amountIn: amountInBaseUnits, // ✅ Utiliser les unités de base pour l'API
        gasInclude: true,
        slippageTolerance: 200
      })

      console.log("routeSummary", routeSummary);

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

  const performSwapWithdraw = async (params: {
    tggAmount: string
    outputToken: Address
    routerAddress: Address
    walletAddress: Address
  }) => {
    try {

      console.log("params.tggAmount", params.tggAmount);
      console.log("params.outputToken", params.outputToken);
      console.log("params.routerAddress", params.routerAddress);
      console.log("params.walletAddress", params.walletAddress);

      // 1. Vérifier les soldes TGG
      const tggBalance = await checkTokenBalance(CONTRACTS.TGG as Address, params.walletAddress)
      const tggAmountBigInt = BigInt((parseFloat(params.tggAmount) * Math.pow(10, 18)).toString()) // TGG a 18 décimales
      console.log("tggAmountBigInt", tggAmountBigInt);

      if (tggBalance < tggAmountBigInt) {
        throw new Error(`Solde TGG insuffisant. Requis: ${params.tggAmount}, Disponible: ${(Number(tggBalance) / Math.pow(10, 18)).toFixed(4)}`)
      }

      // 2. Vérifier l'allowance TGG pour le contrat ZAP
      const currentAllowance = await checkAllowance(
        CONTRACTS.TGG as Address,
        params.walletAddress,
        CONTRACTS.ZAP as Address
      )

      if (currentAllowance < tggAmountBigInt) {
        await approveToken(CONTRACTS.TGG as Address, CONTRACTS.ZAP as Address, tggAmountBigInt)
      }

      // 3. Obtenir la route de swap PAXG → outputToken

      const conversion = await getConversion({ tggAmount: params.tggAmount })
      
      // Convertir en entier avant BigInt (Math.floor pour éviter les décimales)
      const conversionInteger = Math.floor(conversion * Math.pow(10, 18))
      const conversionBigInt = BigInt(conversionInteger)
      const paxgAmountInBaseUnits = conversionBigInt.toString()

      console.log("paxgAmountInBaseUnits", paxgAmountInBaseUnits);

      const routeSummary = await getSwapRoute({
        tokenIn: CONTRACTS.PAXG as Address,
        tokenOut: params.outputToken,
        amountIn: paxgAmountInBaseUnits,
        gasInclude: true,
        slippageTolerance: 200
      })

      // 4. Construire les données de swap automatiquement
      const swapData = await buildSwapData({
        routeSummary,
        sender: CONTRACTS.ZAP as Address,
        recipient: CONTRACTS.ZAP as Address,
        slippageTolerance: 200,
        source: 'tokeshare-dapp'
      })

      // 5. Exécuter le zapWithdraw avec le swapData construit
      const result = await zapWithdraw(
        params.tggAmount,
        params.outputToken,
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
    swapWithdraw: performSwapWithdraw,
    isPending,
    error,
    hash,
    getSwapRoute,
    buildSwapData,
    checkTokenBalance,
    checkAllowance,
    approveToken,
    useZapFees,
    getZapFees,
    getConversion
  }
}
