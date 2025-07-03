import React, { useState, useEffect, useContext } from 'react';
import TradeWidget from '@/components/shared/TradeWidget';
import Image from 'next/image';
import Blockchains from '@/components/Blockchains';
import { calculateTGGPrice } from '@/utils/priceUtils';
import { useAccount } from 'wagmi';
import ConnectButton from '@/components/shared/ConnectButton';
import { TokenContexts } from '@/context/TokenContexts';
import { usePaxgPrice } from '@/hooks/usePaxgPrice';
import { useSwap } from '@/hooks/useSwap';
import { useSwapQuote } from '@/hooks/useSwapQuote';
import { POLYGON_ADDRESSES } from '@/utils/addresses/polygonAddresses';
import { BASE_ADDRESSES } from '@/utils/addresses/baseAddresses';
import { CONTRACTS, TRUSTED_AGGREGATORS } from '@/contracts/contracts';
import { Address } from 'viem';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { SwapDirection } from '@/enums/Directions';
import { useAppKitNetwork } from '@reown/appkit/react';
import { polygon } from '@reown/appkit/networks';

// Définir le type pour les propriétés acceptées par TradeWidget
type TradeWidgetType = 'stablecoin' | 'crypto' | 'fiat';

const Swap = () => {
  const {
    swap: { token: stablecoin, blockchain: selectedBlockchain },
    updateSwapToken: setStablecoin,
    updateSwapBlockchain: setSelectedBlockchain,
  } = useContext(TokenContexts);

  const [stablecoinAmount, setStablecoinAmount] = useState('10');
  const [tggAmount, setTggAmount] = useState('0');
  const [tggPrice, setTggPrice] = useState<number>(0);
  const [isTggFirst, setIsTggFirst] = useState(false);
  const [isPreparingSwap, setIsPreparingSwap] = useState(false);
  const [errorTransaction, setErrorTransaction] = useState('');
  const { isConnected, address } = useAccount();

  const { swapMint, swapWithdraw, isPending, error, hash } = useSwap();
  const { data: paxgPrice, isLoading } = usePaxgPrice();

  const { switchNetwork } = useAppKitNetwork();

  const tokenAddresses = selectedBlockchain === 'Polygon' ? POLYGON_ADDRESSES : BASE_ADDRESSES;

  const [swapQuoteParams, setSwapQuoteParams] = useState({
    inputToken: isTggFirst
      ? (CONTRACTS.TGG as Address)
      : ((tokenAddresses as Record<string, string>)[stablecoin] as Address),
    outputToken: isTggFirst
      ? ((tokenAddresses as Record<string, string>)[stablecoin] as Address)
      : (CONTRACTS.TGG as Address),
    inputAmount: isTggFirst ? tggAmount : stablecoinAmount,
    direction: isTggFirst ? SwapDirection.TGGToStablecoin : SwapDirection.StablecoinToTGG,
  });

  useEffect(() => {
    const tokenAddresses = selectedBlockchain === 'Polygon' ? POLYGON_ADDRESSES : BASE_ADDRESSES;
    const inputToken = isTggFirst
      ? (CONTRACTS.TGG as Address)
      : ((tokenAddresses as Record<string, string>)[stablecoin] as Address);
    const outputToken = isTggFirst
      ? ((tokenAddresses as Record<string, string>)[stablecoin] as Address)
      : (CONTRACTS.TGG as Address);
    const inputAmount = isTggFirst ? tggAmount : stablecoinAmount;
    const direction = isTggFirst ? SwapDirection.TGGToStablecoin : SwapDirection.StablecoinToTGG;
    setSwapQuoteParams({ inputToken, outputToken, inputAmount, direction });
  }, [isTggFirst, tggPrice, stablecoinAmount, tggAmount, stablecoin, selectedBlockchain]);

  const {
    outputAmount: calculatedOutputAmount,
    isLoading: isLoadingQuote,
    error: quoteError,
    exchangeRate,
  } = useSwapQuote(swapQuoteParams);

  // Mise à jour du prix TGG quand paxgPrice change
  useEffect(() => {
    if (paxgPrice !== undefined) {
      const calculatedTggPrice = calculateTGGPrice(paxgPrice);
      setTggPrice(calculatedTggPrice);
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

  useEffect(() => {
    if (errorTransaction) {
      const timeout = setTimeout(() => setErrorTransaction(''), 3000);
      return () => clearTimeout(timeout);
    }
  }, [errorTransaction]);

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
    setStablecoin(blockchain === 'Polygon' ? 'USDT' : 'USDC');
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

    if (exchangeRate) {
      return exchangeRate;
    }
  };

  const swaping = async () => {
    setIsPreparingSwap(true);

    try {
      const tokenAddresses = selectedBlockchain === 'Polygon' ? POLYGON_ADDRESSES : BASE_ADDRESSES;
      const paxgAddress = CONTRACTS.PAXG as Address;
      const routerAddress = TRUSTED_AGGREGATORS.kyberSwap as Address;

      if (!isTggFirst) {
        // Direction: Stablecoin → TGG (swapMint)
        const inputTokenAddress = (tokenAddresses as Record<string, string>)[stablecoin];

        if (!inputTokenAddress) {
          setIsPreparingSwap(false);
          return;
        }

        switchNetwork(polygon);

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
          setIsPreparingSwap(false);
          return;
        }

        switchNetwork(polygon);

        await swapWithdraw({
          tggAmount,
          outputToken: outputTokenAddress as Address,
          routerAddress: routerAddress as Address,
          walletAddress: address as Address,
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrorTransaction(errorMessage);
    } finally {
      setIsPreparingSwap(false);
    }
  };

  useEffect(() => {
    if (isPending) {
      setIsPreparingSwap(false);
    }
  }, [isPending]);

  // Déterminer quel widget est en entrée (modifiable) et lequel est en sortie (lecture seule)
  const topWidgetProps = {
    type: (isTggFirst ? 'crypto' : 'stablecoin') as TradeWidgetType,
    label: 'YOU SEND',
    defaultToken: isTggFirst ? 'TGG' : stablecoin,
    value: isTggFirst ? tggAmount : stablecoinAmount,
    onValueChange: isTggFirst ? handleTggAmountChange : handleStablecoinAmountChange,
    onTokenChange: handleTokenChange,
    blockchain: selectedBlockchain,
    showBalance: true,
    readOnly: false, // Toujours modifiable (input du haut)
  };

  const bottomWidgetProps = {
    type: (isTggFirst ? 'stablecoin' : 'crypto') as TradeWidgetType,
    label: 'YOU RECEIVE',
    defaultToken: isTggFirst ? stablecoin : 'TGG',
    value: isTggFirst ? stablecoinAmount : tggAmount,
    onValueChange: () => {}, // Fonction vide car en lecture seule
    onTokenChange: handleTokenChange,
    blockchain: selectedBlockchain,
    showBalance: true,
    readOnly: true, // Toujours en lecture seule (input du bas)
  };

  // Vérifier si les prix sont disponibles pour permettre l'affichage
  const arePricesAvailable = tggPrice > 0 && !isLoadingQuote;

  return (
    <div className="p-3 sm:p-6 w-full relative">
      <div className="flex flex-col gap-4 sm:gap-6 relative">
        <TradeWidget {...topWidgetProps} />

        <div className="z-10 pt-2 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <button onClick={handleSwap} className="hover:scale-110 active:scale-95 transition-transform duration-200">
            <Image src="/images/switch.png" alt="Swap" width={60} height={60} />
          </button>
        </div>

        <TradeWidget {...bottomWidgetProps} />
      </div>

      <div className="mb-4 sm:mb-6 mt-3 sm:mt-4 space-y-3 sm:space-y-4">
        <Blockchains section="swap" onSelect={handleBlockchainSelect} />

        {/* État de la transaction */}
        {isPreparingSwap && (
          <Alert className="bg-color1">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Preparing Swap</AlertTitle>
            <AlertDescription>
              Checking balances and allowances. Please approve any pending transactions in your wallet.
            </AlertDescription>
          </Alert>
        )}

        {isPending && (
          <Alert className="bg-color1">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Transaction Processing</AlertTitle>
            <AlertDescription>Your transaction is being processed. Please wait...</AlertDescription>
          </Alert>
        )}

        {errorTransaction && (
          <Alert className="bg-red-500">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {errorTransaction.includes('User rejected the request')
                ? 'Transaction cancelled by the user.'
                : errorTransaction}
            </AlertDescription>
          </Alert>
        )}

        {/* Informations sur les prix */}
        <div className="bg-color1 rounded-lg p-3 space-y-2 ">
          <div className="flex items-center justify-between">
            <span className="text-color4 text-xs sm:text-sm font-medium">Delivery time:</span>
            <Badge className="text-xs sm:text-sm font-medium w-20 justify-center">Instant</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-color4 text-xs sm:text-sm font-medium">TGG Price:</span>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <Skeleton className="h-4 w-16" />
              </div>
            ) : (
              <Badge className="text-xs sm:text-sm font-medium w-20 justify-center">${tggPrice.toFixed(2)}</Badge>
            )}
          </div>

          <div className="flex items-center justify-between ">
            <span className="text-color4 text-xs sm:text-sm font-medium">Exchange rate:</span>
            {isLoading || isLoadingQuote ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <Skeleton className="h-4 w-20" />
              </div>
            ) : (
              <Badge className="text-xs sm:text-sm font-medium w-20 justify-center">{exchangeRateInfo()}</Badge>
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
        {isConnected ? (
          <button
            onClick={swaping}
            className={`w-full py-2 sm:py-3 rounded-xl font-medium shadow-sm transition-all duration-200 text-sm sm:text-base flex items-center justify-center gap-2 ${
              arePricesAvailable && !isPending && !isPreparingSwap
                ? 'bg-color4 text-white hover:bg-opacity-90'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
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
              'Swap'
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
