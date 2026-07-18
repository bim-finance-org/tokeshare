import React, { useState, useEffect, useMemo } from 'react';
import TradeWidget from '@/components/shared/TradeWidget';
import Image from 'next/image';
import Blockchains from '@/components/shared/Blockchains';
import { useAccount } from 'wagmi';
import ConnectButton from '@/components/shared/ConnectButton';
import { useTokenContext } from '@/context/TokenContexts';
import { useSwapQuote } from '@/hooks/useSwapQuote';
import { Address } from 'viem';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { SwapDirection } from '@/enums/Directions';
import { TokenInfo } from '@/config/token';
import { Blockchain } from '@/enums/Blockchain';
import { getTokenAddress, getTokenBlockchains } from '@/utils/token';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { ExchangeSection } from '@/enums/ExchangeSection';
import { useAutoSwitchNetwork } from '@/hooks/useAutoSwitchNetwork';
import { TokenType } from '@/enums/TokenType';
import { useSwapHandlerByToken } from '@/hooks/swapHandlers/useSwapHandlerByToken';
import { notify } from '@/lib/notify';

export type SwapQuoteParams = {
  inputToken: Address;
  outputToken: Address;
  inputAmount: string;
  direction: SwapDirection;
};

const Swap = ({ token }: { token: TokenInfo }) => {
  const {
    swap: { token: stablecoin, blockchain: selectedBlockchain },
    updateSwapToken: setStablecoin,
    updateSwapBlockchain: setSelectedBlockchain,
  } = useTokenContext();

  // The swap context defaults to Polygon, but a token may not support it (e.g.
  // TSG is Ethereum-only). Target the token's actual chain so the auto-switch
  // heads straight to the right network instead of briefly aiming at Polygon.
  const availableBlockchains = useMemo(() => getTokenBlockchains(token.symbol), [token.symbol]);
  const targetBlockchain = availableBlockchains.includes(selectedBlockchain)
    ? selectedBlockchain
    : (availableBlockchains[0] ?? selectedBlockchain);
  const { isOnCorrectChain, isPending: isSwitchingNetwork, retry: retrySwitch } = useAutoSwitchNetwork(targetBlockchain);

  // Single source of truth: the value the user just typed into the editable
  // (top) widget. Direction (`isTggFirst`) decides which token it represents.
  // The output amount is derived purely from the quote API.
  const [inputAmount, setInputAmount] = useState('10');
  const [isTggFirst, setIsTggFirst] = useState(false);
  const [isPreparingSwap, setIsPreparingSwap] = useState(false);

  const { isConnected, address } = useAccount();

  const { price: tokenPrice, isLoading: isPriceLoading } = useTokenPrice(token.symbol);
  const { swapIn, swapOut, isPending, error, hash } = useSwapHandlerByToken(token.symbol);

  const swapQuoteParams = useMemo<SwapQuoteParams | null>(() => {
    const inputToken = getTokenAddress(isTggFirst ? token.symbol : stablecoin, selectedBlockchain);
    const outputToken = getTokenAddress(isTggFirst ? stablecoin : token.symbol, selectedBlockchain);
    if (!inputToken || !outputToken) return null;
    const direction = isTggFirst ? SwapDirection.TokenToStablecoin : SwapDirection.StablecoinToToken;
    return { inputToken, outputToken, inputAmount, direction };
  }, [isTggFirst, inputAmount, stablecoin, selectedBlockchain, token.symbol]);

  const {
    outputAmount: calculatedOutputAmount,
    isLoading: isLoadingQuote,
    error: quoteError,
    exchangeRate,
  } = useSwapQuote(swapQuoteParams, token.symbol, selectedBlockchain);

  // Output displayed in the read-only widget — derived from the quote.
  const outputAmount = calculatedOutputAmount ?? '0';

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  const handleInputChange = (amount: string) => {
    if (amount === '' || /^\d*\.?\d*$/.test(amount)) {
      setInputAmount(amount);
    }
  };

  // Handle token selection change
  const handleTokenChange = (token: string) => {
    setStablecoin(token);
  };

  // Handle blockchain selection
  const handleBlockchainSelect = (blockchain: Blockchain) => {
    setSelectedBlockchain(blockchain);
    setStablecoin('USDC');
  };

  const handleSwap = () => {
    const newIsTggFirst = !isTggFirst;
    if (newIsTggFirst && token.symbol === 'TFT_001') {
      setStablecoin('USDC');
    }
    // Carry over the calculated output as the new input so the visible amount
    // doesn't reset when the user flips direction.
    if (calculatedOutputAmount) setInputAmount(calculatedOutputAmount);
    setIsTggFirst(newIsTggFirst);
  };

  // Préparation des informations d'échange
  const exchangeRateInfo = () => {
    if (isPriceLoading || isLoadingQuote) {
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

    // swapIn / swapOut both expect the token (crypto) amount:
    // - Stablecoin → Token: token amount is the OUTPUT (from the quote)
    // - Token → Stablecoin: token amount is the INPUT (user typed it)
    const tokenAmount = isTggFirst ? inputAmount : outputAmount;

    try {
      if (!isTggFirst) {
        await swapIn({
          tokenSymbol: token.symbol,
          stablecoin,
          amount: tokenAmount,
          // Buy: spend exactly the stablecoin amount the user typed (top widget),
          // not a value re-derived from the quoted token amount × spot price.
          stablecoinAmount: inputAmount,
          blockchain: selectedBlockchain,
          walletAddress: address as Address,
        });
      } else {
        await swapOut({
          tokenSymbol: token.symbol,
          stablecoin,
          amount: tokenAmount,
          blockchain: selectedBlockchain,
          walletAddress: address as Address,
        });
      }
    } catch (error: unknown) {
      notify.error(error);
    } finally {
      setIsPreparingSwap(false);
    }
  };

  // While the wagmi tx is pending we display the 'Transaction Processing'
  // alert instead of 'Preparing swap'. Deriving this in render lets us drop
  // the effect that used to flip isPreparingSwap on isPending.
  const showPreparingAlert = isPreparingSwap && !isPending;

  // Déterminer quel widget est en entrée (modifiable) et lequel est en sortie (lecture seule)
  const topWidgetProps = {
    type: (isTggFirst ? TokenType.Crypto : TokenType.Stablecoin) as TokenType,
    label: 'YOU SEND',
    defaultToken: isTggFirst ? token.symbol : stablecoin,
    value: inputAmount,
    onValueChange: handleInputChange,
    onTokenChange: handleTokenChange,
    blockchain: selectedBlockchain,
    showBalance: true,
    readOnly: false,
  };

  const isTftSellMode = isTggFirst && token.symbol === 'TFT_001';

  const bottomWidgetProps = {
    type: (isTggFirst ? TokenType.Stablecoin : TokenType.Crypto) as TokenType,
    label: 'YOU RECEIVE',
    defaultToken: isTggFirst ? (isTftSellMode ? 'USDC' : stablecoin) : token.symbol,
    value: outputAmount,
    onValueChange: () => {},
    onTokenChange: handleTokenChange,
    blockchain: selectedBlockchain,
    showBalance: true,
    readOnly: true,
    lockedToken: isTftSellMode,
  };

  // Vérifier si les prix sont disponibles pour permettre l'affichage
  let arePricesAvailable;
  if (tokenPrice) arePricesAvailable = tokenPrice > 0 && !isLoadingQuote;

  return (
    <div className="p-3 sm:p-6 w-full relative">
      <div className="flex flex-col gap-4 sm:gap-6 relative">
        <TradeWidget {...topWidgetProps} />

        <div className="z-10 pt-2 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <button type="button" onClick={handleSwap} className="relative w-10 h-10 sm:w-[60px] sm:h-[60px] hover:scale-110 active:scale-95 transition-transform duration-200">
            <Image src="/images/switch.png" alt="Swap" fill className="object-contain" />
          </button>
        </div>

        <TradeWidget {...bottomWidgetProps} />
      </div>

      <div className="mb-4 sm:mb-6 mt-3 sm:mt-4 space-y-3 sm:space-y-4">
        <Blockchains section={ExchangeSection.Swap} onSelect={handleBlockchainSelect} tokenSymbol={token.symbol} />

        {/* État de la transaction */}
        {showPreparingAlert && (
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

        {isConnected && !isOnCorrectChain && (
          <Alert className="bg-amber-500">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Wrong Network</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>Please switch to {targetBlockchain} network to continue.</span>
              {isSwitchingNetwork ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Switching network...
                </span>
              ) : (
                <button type="button"
                  onClick={retrySwitch}
                  className="text-sm underline hover:no-underline self-start"
                >
                  Click here to switch automatically
                </button>
              )}
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
            <span className="text-color4 text-xs sm:text-sm font-medium">{token.symbol} Price:</span>
            {isPriceLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <Skeleton className="h-4 w-16" />
              </div>
            ) : (
              <Badge className="text-xs sm:text-sm font-medium w-20 justify-center">${tokenPrice?.toFixed(2)}</Badge>
            )}
          </div>

          <div className="flex items-center justify-between ">
            <span className="text-color4 text-xs sm:text-sm font-medium">Exchange rate:</span>
            {isPriceLoading || isLoadingQuote ? (
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

          {hash && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-color4 text-xs sm:text-sm font-medium">Transaction:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-black bg-gray-100 font-mono px-2 py-1 rounded">
                  {hash.slice(0, 6)}...{hash.slice(-4)}
                </span>
                <button type="button"
                  onClick={() => {
                    const explorers: Record<Blockchain, string> = {
                      [Blockchain.Polygon]: 'https://polygonscan.com',
                      [Blockchain.Base]: 'https://basescan.org',
                      [Blockchain.Ethereum]: 'https://etherscan.io',
                    };
                    window.open(`${explorers[selectedBlockchain]}/tx/${hash}`, '_blank');
                  }}
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
          <button type="button"
            onClick={swaping}
            className={`w-full py-2 sm:py-3 rounded-xl font-medium shadow-sm transition-all duration-200 text-sm sm:text-base flex items-center justify-center gap-2 ${
              arePricesAvailable && !isPending && !isPreparingSwap && isOnCorrectChain
                ? 'bg-color4 text-white hover:bg-opacity-90'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
            disabled={!arePricesAvailable || isPending || isPreparingSwap || !isOnCorrectChain}
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
