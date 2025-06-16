import React, { useState, useEffect, useContext } from "react";
import TradeWidget from "@/components/shared/TradeWidget";
import Image from "next/image";
import Blockchains from "@/components/Blockchains";
import { calculateTGGPrice } from "@/utils/priceUtils";
import { useAccount } from 'wagmi';
import ConnectButton from "@/components/shared/ConnectButton";
import { TokenContexts } from '@/context/TokenContexts';
import { usePaxgPrice } from '@/hooks/usePaxgPrice';
import { useSwap } from "@/hooks/useSwap";
import { useSwapQuote } from "@/hooks/useSwapQuote";
import { POLYGON_ADDRESSES } from '@/utils/addresses/polygonAddresses';
import { BASE_ADDRESSES } from '@/utils/addresses/baseAddresses';
import { CONTRACTS, TRUSTED_AGGREGATORS } from "@/contracts/contracts";
import { Address } from "viem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";

// Définir le type pour les propriétés acceptées par TradeWidget
type TradeWidgetType = "stablecoin" | "crypto" | "fiat";

const Swap = () => {
  // Utiliser le context au lieu de useState + localStorage
  const { 
    swap: { token: stablecoin, blockchain: selectedBlockchain },
    updateSwapToken: setStablecoin,
    updateSwapBlockchain: setSelectedBlockchain
  } = useContext(TokenContexts);
  
  // État local qui reste inchangé
  const [stablecoinAmount, setStablecoinAmount] = useState("10");
  const [tggAmount, setTggAmount] = useState("0");
  const [tggPrice, setTggPrice] = useState<number>(0);
  const [isTggFirst, setIsTggFirst] = useState(false);
  const [isPreparingSwap, setIsPreparingSwap] = useState(false);
  const { isConnected, address } = useAccount();
  
  // Hooks pour le swap
  const { swapMint, swapWithdraw, isPending, error, hash } = useSwap();
  
  // Hook pour les toasts
  const { toast } = useToast();
  
  // Récupérer les prix via les hooks
  const { data: paxgPrice, isLoading } = usePaxgPrice();
  
  // Préparer les paramètres pour le hook useSwapQuote
  const tokenAddresses = selectedBlockchain === 'Polygon' ? POLYGON_ADDRESSES : BASE_ADDRESSES;
  const inputToken = isTggFirst ? CONTRACTS.TGG as Address : (tokenAddresses as Record<string, string>)[stablecoin] as Address;
  const outputToken = isTggFirst ? (tokenAddresses as Record<string, string>)[stablecoin] as Address : CONTRACTS.TGG as Address;
  const inputAmount = isTggFirst ? tggAmount : stablecoinAmount;
  const direction = isTggFirst ? 'tgg-to-stablecoin' : 'stablecoin-to-tgg';
  
  // Hook pour obtenir les vrais montants de swap via KyberSwap
  const swapQuoteParams = inputToken && outputToken && inputAmount && parseFloat(inputAmount) > 0 ? {
    inputToken,
    outputToken,
    inputAmount,
    direction: direction as 'stablecoin-to-tgg' | 'tgg-to-stablecoin'
  } : null;
  
  const { 
    outputAmount: calculatedOutputAmount, 
    isLoading: isLoadingQuote, 
    error: quoteError,
    exchangeRate 
  } = useSwapQuote(swapQuoteParams);

  // Mise à jour du prix TGG quand paxgPrice change
  useEffect(() => {
    if (paxgPrice !== undefined) {
      const calculatedTggPrice = calculateTGGPrice(paxgPrice);
      setTggPrice(calculatedTggPrice);
      console.log("TGG price updated:", calculatedTggPrice, "from PAXG:", paxgPrice);
    }
  }, [paxgPrice]);

  // Mettre à jour automatiquement le montant de sortie basé sur les calculs KyberSwap
  useEffect(() => {
    if (calculatedOutputAmount && !isLoadingQuote) {
      if (isTggFirst) {
        // TGG → Stablecoin
        setStablecoinAmount(calculatedOutputAmount);
      } else {
        // Stablecoin → TGG
        setTggAmount(calculatedOutputAmount);
      }
    }
  }, [calculatedOutputAmount, isTggFirst, isLoadingQuote]);

  // Handle stablecoin amount change
  const handleStablecoinAmountChange = (amount: string) => {
    if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
      setStablecoinAmount(amount);
    }
  };

  // Handle TGG amount change
  const handleTggAmountChange = (amount: string) => {
    if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
      setTggAmount(amount);
    }
  };

  // Handle token selection change
  const handleTokenChange = (token: string) => {
    setStablecoin(token);
  };

  // Handle blockchain selection
  const handleBlockchainSelect = (blockchain: string) => {
    setSelectedBlockchain(blockchain);
    setStablecoin(blockchain === "Polygon" ? "USDT" : "USDC");
  };

  // Handle swap button click
  const handleSwap = () => {
    setIsTggFirst(!isTggFirst);
  };

  // Préparation des informations d'échange
  const exchangeRateInfo = () => {
    if (isLoading || isLoadingQuote) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Loading rate...</span>
        </div>
      );
    }
    
    // Utiliser le taux de change calculé par KyberSwap si disponible
    if (exchangeRate) {
      return exchangeRate;
    }
    
    // Fallback au calcul basique si pas de données KyberSwap
    return `1 TGG = ${tggPrice.toFixed(2)} ${stablecoin}`;
  };

  const swaping = async () => {
    setIsPreparingSwap(true);
    
    try {
      // Récupérer les adresses selon la blockchain
      const tokenAddresses = selectedBlockchain === 'Polygon' ? POLYGON_ADDRESSES : BASE_ADDRESSES;
      
      // Adresse PAXG (token de backing pour TGG)
      const paxgAddress = CONTRACTS.PAXG as Address; // PAXG sur Polygon
      
      const routerAddress = TRUSTED_AGGREGATORS.kyberSwap as Address;

      if (!isTggFirst) {
        // Direction: Stablecoin → TGG (swapMint)
        const inputTokenAddress = (tokenAddresses as Record<string, string>)[stablecoin];
        
        if (!inputTokenAddress) {
          toast({
            variant: "destructive",
            title: "Configuration Error",
            description: `Token address for ${stablecoin} not found on ${selectedBlockchain}`,
          });
          setIsPreparingSwap(false);
          return;
        }

        console.log("stablecoinAmount", stablecoinAmount);

        // Notification pour informer l'utilisateur que la préparation commence
        toast({
          title: "Preparing swap...",
          description: "Checking balances and preparing transaction. Please wait for approval prompts.",
        });

        await swapMint({
          inputToken: inputTokenAddress as Address,
          inputAmount: stablecoinAmount,
          outputToken: paxgAddress,
          routerAddress: routerAddress,
          walletAddress: address as Address,
        });

      } else {
        // Direction: TGG → Stablecoin (swapWithdraw)
        const outputTokenAddress = (tokenAddresses as Record<string, string>)[stablecoin];
        
        if (!outputTokenAddress) {
          toast({
            variant: "destructive",
            title: "Configuration Error",
            description: `Token address for ${stablecoin} not found on ${selectedBlockchain}`,
          });
          setIsPreparingSwap(false);
          return;
        }

        // Notification pour informer l'utilisateur que la préparation commence
        toast({
          title: "Preparing swap...",
          description: "Checking TGG balance and preparing transaction. Please wait for approval prompts.",
        });

        await swapWithdraw({
          tggAmount,
          outputToken: outputTokenAddress as Address,
          routerAddress: routerAddress as Address,
          walletAddress: address as Address,
        });
      }
      
    } catch (error: unknown) {
      console.error("❌ Erreur lors du swap:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Messages d'erreur plus informatifs avec toast
      if (errorMessage.includes('Solde insuffisant') || errorMessage.includes('Insufficient balance')) {
        toast({
          variant: "destructive",
          title: "Insufficient Balance",
          description: "You need to have at least 1 USDC in your wallet on Polygon.",
        });
      } else if (errorMessage.includes('User rejected')) {
        toast({
          variant: "destructive",
          title: "Transaction Cancelled",
          description: "The transaction was cancelled by the user.",
        });
      } else if (errorMessage.includes('TRANSFER_FROM_FAILED')) {
        toast({
          variant: "destructive",
          title: "Transfer Failed",
          description: "Please verify you have enough USDC and your wallet is on the Polygon network.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Swap Error",
          description: errorMessage || 'Unknown error',
        });
      }
    } finally {
      // Toujours remettre à false, même en cas d'erreur
      setIsPreparingSwap(false);
    }
  };

  // Effect pour gérer la transition des états et les notifications
  useEffect(() => {
    if (isPending) {
      // Quand la transaction devient pending, on arrête la préparation
      setIsPreparingSwap(false);
    }
  }, [isPending]);

  // Effect pour gérer les notifications de succès de transaction
  useEffect(() => {
    if (hash) {
      toast({
        title: "Transaction Sent!",
        description: (
          <div className="flex flex-col gap-2">
            <p>Your transaction is being processed.</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {hash.slice(0, 6)}...{hash.slice(-4)}
              </span>
              <button
                onClick={() => window.open(`https://polygonscan.com/tx/${hash}`, '_blank')}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-3 w-3" />
                View
              </button>
            </div>
          </div>
        ),
      });
    }
  }, [hash, toast]);

  // Effect pour gérer les erreurs globales du swap
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Transaction Error",
        description: error.message || String(error),
      });
    }
  }, [error, toast]);

  // Debugging
  useEffect(() => {
    console.log("Stablecoin changed to:", stablecoin, "Exchange rate:", exchangeRate);
  }, [stablecoin, exchangeRate]);

  // Déterminer quel widget est en entrée (modifiable) et lequel est en sortie (lecture seule)
  const topWidgetProps = {
    type: (isTggFirst ? "crypto" : "stablecoin") as TradeWidgetType,
    label: "YOU SEND",
    defaultToken: isTggFirst ? "TGG" : stablecoin,
    value: isTggFirst ? tggAmount : stablecoinAmount,
    onValueChange: isTggFirst ? handleTggAmountChange : handleStablecoinAmountChange,
    onTokenChange: handleTokenChange,
    blockchain: selectedBlockchain,
    showBalance: true,
    readOnly: false // Toujours modifiable (input du haut)
  };

  const bottomWidgetProps = {
    type: (isTggFirst ? "stablecoin" : "crypto") as TradeWidgetType,
    label: "YOU RECEIVE",
    defaultToken: isTggFirst ? stablecoin : "TGG",
    value: isTggFirst ? stablecoinAmount : tggAmount,
    onValueChange: () => {}, // Fonction vide car en lecture seule
    onTokenChange: handleTokenChange,
    blockchain: selectedBlockchain,
    showBalance: true,
    readOnly: true // Toujours en lecture seule (input du bas)
  };

  // Vérifier si les prix sont disponibles pour permettre l'affichage
  const arePricesAvailable = tggPrice > 0 && !isLoadingQuote;

  return (
    <div className="p-3 sm:p-6 w-full relative">
      <div className="flex flex-col gap-4 sm:gap-6 relative">
        <TradeWidget
          {...topWidgetProps}
        />

        <div className="z-10 pt-2 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <button 
            onClick={handleSwap}
            className="hover:scale-110 active:scale-95 transition-transform duration-200"
          >
            <Image src="/images/switch.png" alt="Swap" width={60} height={60} />
          </button>
        </div>

        <TradeWidget
          {...bottomWidgetProps}
        />
      </div>

      <div className="mb-4 sm:mb-6 mt-3 sm:mt-4 space-y-3 sm:space-y-4">
        <Blockchains section="swap" onSelect={handleBlockchainSelect} />
        
        {/* État de la transaction */}
        {isPreparingSwap && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Preparing Swap</AlertTitle>
            <AlertDescription>
              Checking balances and allowances. Please approve any pending transactions in your wallet.
            </AlertDescription>
          </Alert>
        )}
        
        {isPending && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Transaction Processing</AlertTitle>
            <AlertDescription>
              Your transaction is being processed. Please wait...
            </AlertDescription>
          </Alert>
        )}
        
        {/* Informations sur les prix */}
        <div className="bg-white/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-color4 text-xs sm:text-sm font-medium">Delivery time:</span>
            <Badge variant="secondary">Instant</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-color4 text-xs sm:text-sm font-medium">TGG Price:</span>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <Skeleton className="h-4 w-16" />
              </div>
            ) : (
              <Badge>${tggPrice.toFixed(2)}</Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-color4 text-xs sm:text-sm font-medium">Exchange rate:</span>
            {isLoading || isLoadingQuote ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <Skeleton className="h-4 w-20" />
              </div>
            ) : (
              <span className="text-xs sm:text-sm font-medium">{exchangeRateInfo()}</span>
            )}
          </div>
          
          {/* Afficher les erreurs de quote si il y en a */}
          {quoteError && (
            <div className="flex items-center justify-between">
              <span className="text-color4 text-xs sm:text-sm font-medium">Quote status:</span>
              <Badge variant="destructive">Error loading quote</Badge>
            </div>
          )}
          
          {/* Hash de transaction */}
          {hash && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-color4 text-xs sm:text-sm font-medium">Transaction:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  {hash.slice(0, 6)}...{hash.slice(-4)}
                </span>
                <button
                  onClick={() => window.open(`https://polygonscan.com/tx/${hash}`, '_blank')}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 sm:mt-6 space-y-3">
        {/* Affichage d'erreur globale */}
        {!arePricesAvailable && !isLoading && !isLoadingQuote && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Prices Unavailable</AlertTitle>
            <AlertDescription>
              Unable to fetch prices for this conversion. Please try again later.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Affichage d'erreur de quote */}
        {quoteError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Quote Error</AlertTitle>
            <AlertDescription>
              {quoteError}
            </AlertDescription>
          </Alert>
        )}
        
        {isConnected ? (
          <button 
            onClick={swaping}
            className={`w-full py-2 sm:py-3 rounded-xl font-medium shadow-sm transition-all duration-200 text-sm sm:text-base flex items-center justify-center gap-2 ${
              arePricesAvailable && !isPending && !isPreparingSwap
                ? "bg-color4 text-white hover:bg-opacity-90" 
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
            disabled={!arePricesAvailable || isPending || isPreparingSwap}
          >
            {isPreparingSwap ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Preparing swap...</span>
              </>
            ) : isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing transaction...</span>
              </>
            ) : (
              "Swap"
            )}
          </button>
        ) : (
          <ConnectButton />
        )}
      </div>
    </div>
  );
};

export default Swap;

