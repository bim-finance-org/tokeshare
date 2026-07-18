import React, { useState, useEffect, useMemo, useRef } from 'react';
import TradeWidget, { type TokenSelectorConfig } from '@/components/shared/TradeWidget';
import TokenSelector from '@/components/shared/TokenSelector';
import Image from 'next/image';
import Blockchains from '@/components/shared/Blockchains';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import ConnectButton from '@/components/shared/ConnectButton';
import { useTokenContext } from '@/context/TokenContexts';
import { useSwapQuote, MINIMUM_AMOUNT_TO_GET_QUOTE, type SwapQuoteParams } from '@/hooks/useSwapQuote';
import { Address } from 'viem';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { SwapDirection } from '@/enums/Directions';
import { TokenInfo } from '@/config/token';
import { Blockchain } from '@/enums/Blockchain';
import { getTokenAddress, getTokenBlockchains } from '@/utils/token';
import { useTokenBalance } from '@/utils/blockchainUtils';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { ExchangeSection } from '@/enums/ExchangeSection';
import { useAutoSwitchNetwork } from '@/hooks/useAutoSwitchNetwork';
import { TokenType } from '@/enums/TokenType';
import { useSwapHandlerByToken } from '@/hooks/swapHandlers/useSwapHandlerByToken';
import { useRefreshBalancesOnConfirm } from '@/hooks/useRefreshBalancesOnConfirm';
import { notify } from '@/lib/notify';
import { showSwapProgress, type SwapPhase } from '@/lib/swapToast';
import { explorerTxUrl } from '@/utils/explorer';

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
  // (top) widget. Direction (`isTokenFirst`) decides which token it represents.
  // The output amount is derived purely from the quote API.
  const [inputAmount, setInputAmount] = useState('10');
  const [isTokenFirst, setIsTokenFirst] = useState(false);
  const [isPreparingSwap, setIsPreparingSwap] = useState(false);
  // Which widget (if any) asked to open the token list. Lifted here so the
  // picker renders at the card level and covers the whole swap body.
  const [tokenPicker, setTokenPicker] = useState<TokenSelectorConfig | null>(null);

  const { isConnected, address } = useAccount();

  const { price: tokenPrice, isLoading: isPriceLoading, isError: isPriceError, refetch: refetchPrice } = useTokenPrice(
    token.symbol,
  );
  const { swapIn, swapOut, isPending, error, hash } = useSwapHandlerByToken(token.symbol);

  // Once the swap tx confirms, refresh balances so the widgets reflect the new
  // amounts immediately. Works for every token (targets shared wagmi keys).
  useRefreshBalancesOnConfirm(hash as `0x${string}` | undefined);

  const swapQuoteParams = useMemo<SwapQuoteParams | null>(() => {
    const inputToken = getTokenAddress(isTokenFirst ? token.symbol : stablecoin, selectedBlockchain);
    const outputToken = getTokenAddress(isTokenFirst ? stablecoin : token.symbol, selectedBlockchain);
    if (!inputToken || !outputToken) return null;
    const direction = isTokenFirst ? SwapDirection.TokenToStablecoin : SwapDirection.StablecoinToToken;
    return { inputToken, outputToken, inputAmount, direction };
  }, [isTokenFirst, inputAmount, stablecoin, selectedBlockchain, token.symbol]);

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

  // Success feedback: fire a toast (with an explorer link) once the swap tx
  // confirms on-chain, so the user gets a clear "done" signal instead of only
  // a discreet truncated hash. Guarded by a ref so it fires once per hash.
  const { isSuccess: isSwapConfirmed } = useWaitForTransactionReceipt({ hash: hash as `0x${string}` | undefined });
  const notifiedHashRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!isSwapConfirmed || !hash || notifiedHashRef.current === hash) return;
    notifiedHashRef.current = hash;
    notify.success(
      'Swap confirmed',
      <a
        href={explorerTxUrl(selectedBlockchain, hash)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 underline hover:no-underline"
      >
        View on explorer
        <ExternalLink className="h-3 w-3" />
      </a>,
    );
  }, [isSwapConfirmed, hash, selectedBlockchain]);

  // Derived swap phase. `isConfirming` keeps us in "processing" from the moment
  // the tx hash exists until the receipt confirms — bridging the gap after
  // signing where isPending is already false but the hash/receipt isn't in yet
  // (in wagmi v2 hash lands as isPending flips, so the button never blinks back
  // to "Swap"). Drives both the button and the progress toast.
  const isConfirming = Boolean(hash) && !isSwapConfirmed;
  const swapPhase: 'idle' | SwapPhase = isPending || isConfirming ? 'processing' : isPreparingSwap ? 'preparing' : 'idle';

  // Mirror the phase into a single themed progress toast (preparing → processing
  // with a progress bar). The success/error toasts replace it on settle. Calls
  // the external toast store only — no component setState in the effect.
  const swapProgressRef = useRef<ReturnType<typeof showSwapProgress> | null>(null);
  useEffect(() => {
    if (swapPhase === 'idle') {
      // Flow ended: drop the handle so the next swap starts a fresh toast.
      swapProgressRef.current = null;
      return;
    }
    if (swapProgressRef.current) {
      swapProgressRef.current.setPhase(swapPhase);
    } else {
      swapProgressRef.current = showSwapProgress(swapPhase);
    }
  }, [swapPhase]);

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
    const newIsTggFirst = !isTokenFirst;
    if (newIsTggFirst && token.symbol === 'TFT_001') {
      setStablecoin('USDC');
    }
    // Carry over the calculated output as the new input so the visible amount
    // doesn't reset when the user flips direction.
    if (calculatedOutputAmount) setInputAmount(calculatedOutputAmount);
    setIsTokenFirst(newIsTggFirst);
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
    const tokenAmount = isTokenFirst ? inputAmount : outputAmount;

    try {
      if (!isTokenFirst) {
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
      // The write is fire-and-forget, so this resolves before signing. That's
      // fine: once it resolves, isPending (then the hash → isConfirming) keep
      // swapPhase on "processing" until the tx settles.
      setIsPreparingSwap(false);
    }
  };

  // Déterminer quel widget est en entrée (modifiable) et lequel est en sortie (lecture seule)
  const topWidgetProps = {
    type: (isTokenFirst ? TokenType.Crypto : TokenType.Stablecoin) as TokenType,
    label: 'YOU SEND',
    defaultToken: isTokenFirst ? token.symbol : stablecoin,
    value: inputAmount,
    onValueChange: handleInputChange,
    onTokenChange: handleTokenChange,
    blockchain: selectedBlockchain,
    showBalance: true,
    readOnly: false,
  };

  const isTftSellMode = isTokenFirst && token.symbol === 'TFT_001';

  const bottomWidgetProps = {
    type: (isTokenFirst ? TokenType.Stablecoin : TokenType.Crypto) as TokenType,
    label: 'YOU RECEIVE',
    defaultToken: isTokenFirst ? (isTftSellMode ? 'USDC' : stablecoin) : token.symbol,
    value: outputAmount,
    onValueChange: () => {},
    onTokenChange: handleTokenChange,
    blockchain: selectedBlockchain,
    showBalance: true,
    readOnly: true,
    lockedToken: isTftSellMode,
    // Surface quote recomputation on the output field with a skeleton.
    loading: isLoadingQuote,
  };

  // Vérifier si les prix sont disponibles pour permettre l'affichage
  let arePricesAvailable;
  if (tokenPrice) arePricesAvailable = tokenPrice > 0 && !isLoadingQuote;

  // Price feed failed / returned nothing (and not just still loading): surface a
  // retry instead of leaving the Swap button silently disabled.
  const priceUnavailable = !isPriceLoading && (isPriceError || !tokenPrice);

  // Garde-fou de solde : le widget du haut est ce que l'utilisateur envoie.
  // On compare le montant saisi au solde on-chain de ce token pour bloquer le
  // swap AVANT qu'il ne revert (évite une approbation + du gas gaspillés).
  const inputTokenSymbol = isTokenFirst ? token.symbol : stablecoin;
  const inputBalance = useTokenBalance(inputTokenSymbol, selectedBlockchain);
  const parsedAmount = parseFloat(inputAmount);
  const hasValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  // Below this the quote query stays disabled (output would read "0"): tell the
  // user why instead of leaving a mute widget.
  const isBelowMinimum = hasValidAmount && parsedAmount < MINIMUM_AMOUNT_TO_GET_QUOTE;
  const isInsufficientBalance = isConnected && hasValidAmount && parseFloat(inputBalance) < parsedAmount;

  const canSwap = Boolean(
    arePricesAvailable &&
      hasValidAmount &&
      !isBelowMinimum &&
      !isInsufficientBalance &&
      swapPhase === 'idle' &&
      isOnCorrectChain,
  );

  const swapButtonLabel = !hasValidAmount
    ? 'Enter an amount'
    : isBelowMinimum
      ? `Minimum ${MINIMUM_AMOUNT_TO_GET_QUOTE} ${inputTokenSymbol}`
      : isInsufficientBalance
        ? `Insufficient ${inputTokenSymbol} balance`
        : 'Swap';

  return (
    <div className="p-3 sm:p-6 w-full relative">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400">Network</span>
        <Blockchains section={ExchangeSection.Swap} onSelect={handleBlockchainSelect} tokenSymbol={token.symbol} />
      </div>

      <div className="flex flex-col gap-4 sm:gap-6 relative">
        <TradeWidget {...topWidgetProps} onOpenSelector={setTokenPicker} />

        <div className="z-10 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={handleSwap}
            aria-label="Switch direction"
            className="flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white ring-1 ring-black/10 shadow-md hover:scale-110 hover:rotate-180 active:scale-95 transition-transform duration-300"
          >
            <span className="relative w-5 h-5 sm:w-7 sm:h-7">
              <Image src="/images/switch.png" alt="Swap" fill className="object-contain" />
            </span>
          </button>
        </div>

        <TradeWidget {...bottomWidgetProps} onOpenSelector={setTokenPicker} />
      </div>

      <div className="mb-4 sm:mb-6 mt-3 sm:mt-4 space-y-3 sm:space-y-4">
        {/* Swap progress is surfaced via a toast (see swapPhase effect). */}
        {isConnected && !isOnCorrectChain && (
          <Alert className="bg-amber-50 border-amber-200 text-amber-900 rounded-xl [&>svg]:text-amber-600">
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

        {priceUnavailable && (
          <Alert className="bg-amber-50 border-amber-200 text-amber-900 rounded-xl [&>svg]:text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Price unavailable</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>{token.symbol} price could not be loaded. Please try again.</span>
              <button
                type="button"
                onClick={() => refetchPrice()}
                className="text-sm underline hover:no-underline self-start"
              >
                Retry
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Informations sur les prix */}
        <div className="bg-color1 rounded-2xl px-3.5 py-3 space-y-2.5 ring-1 ring-inset ring-black/5">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs sm:text-sm font-medium">Delivery time</span>
            <span className="inline-flex items-center gap-1.5 text-color4 text-xs sm:text-sm font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-color3" />
              Instant
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs sm:text-sm font-medium">{token.symbol} Price</span>
            {isPriceLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <Skeleton className="h-4 w-16" />
              </div>
            ) : (
              <span className="text-color4 text-xs sm:text-sm font-semibold tabular-nums">${tokenPrice?.toFixed(2)}</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs sm:text-sm font-medium">Exchange rate</span>
            {isPriceLoading || isLoadingQuote ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <Skeleton className="h-4 w-20" />
              </div>
            ) : (
              <span className="text-color4 text-xs sm:text-sm font-semibold tabular-nums">{exchangeRateInfo()}</span>
            )}
          </div>

          {/* Afficher les erreurs de quote si il y en a */}
          {quoteError && (
            <div className="flex items-center justify-between pt-1 border-t border-black/5">
              <span className="text-gray-500 text-xs sm:text-sm font-medium">Quote status</span>
              <Badge variant="destructive">Error loading quote</Badge>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 sm:mt-6 space-y-3">
        {isConnected ? (
          <button type="button"
            onClick={swaping}
            className={`w-full py-3 sm:py-3.5 rounded-2xl font-titleSemibold tracking-wide transition-all duration-200 text-sm sm:text-base flex items-center justify-center gap-2 ${
              canSwap
                ? 'bg-color4 text-white shadow-md hover:bg-color2 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!canSwap}
          >
            {swapPhase === 'preparing' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Preparing swap...</span>
              </>
            ) : swapPhase === 'processing' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing transaction...</span>
              </>
            ) : (
              swapButtonLabel
            )}
          </button>
        ) : (
          <ConnectButton />
        )}
      </div>

      {/* Token picker: rendered at the card root so it fills the whole swap body
          (widgets + info panel + Swap button), not just a single widget. */}
      {tokenPicker && (
        <TokenSelector
          isOpen
          type={tokenPicker.type}
          blockchain={tokenPicker.blockchain}
          selected={tokenPicker.selected}
          onSelect={(token) => {
            tokenPicker.onSelect(token);
            setTokenPicker(null);
          }}
          onClose={() => setTokenPicker(null)}
        />
      )}
    </div>
  );
};

export default Swap;
