type AnyError = unknown;

const isObject = (val: unknown): val is Record<string, unknown> => typeof val === 'object' && val !== null;

const walkCauseChain = (err: AnyError): unknown[] => {
  const chain: unknown[] = [];
  let current: unknown = err;
  const seen = new Set<unknown>();
  while (isObject(current) && !seen.has(current)) {
    seen.add(current);
    chain.push(current);
    current = current.cause;
  }
  return chain;
};

const findInChain = (chain: unknown[], match: (e: Record<string, unknown>) => boolean) =>
  chain.find((e): e is Record<string, unknown> => isObject(e) && match(e));

const matchesMessage = (e: Record<string, unknown>, patterns: RegExp[]) => {
  const msg = typeof e.message === 'string' ? e.message : '';
  const shortMsg = typeof e.shortMessage === 'string' ? e.shortMessage : '';
  return patterns.some((re) => re.test(msg) || re.test(shortMsg));
};

const matchesName = (e: Record<string, unknown>, names: string[]) =>
  typeof e.name === 'string' && names.includes(e.name);

/**
 * Map a viem/wagmi (or any) error to a short, human-readable message.
 * Walks the `cause` chain so wrapped errors are also recognized.
 */
export function parseError(err: AnyError): string {
  if (err == null) return 'An unexpected error occurred.';

  const chain = walkCauseChain(err);

  if (
    findInChain(chain, (e) =>
      matchesName(e, ['UserRejectedRequestError']) ||
      matchesMessage(e, [/user rejected/i, /user denied/i, /rejected the request/i]),
    )
  ) {
    return 'Transaction cancelled.';
  }

  if (
    findInChain(chain, (e) =>
      matchesName(e, ['InsufficientFundsError']) ||
      matchesMessage(e, [/insufficient funds/i, /insufficient balance/i, /exceeds.*balance/i]),
    )
  ) {
    return 'Insufficient funds to complete this transaction.';
  }

  if (
    findInChain(chain, (e) =>
      matchesName(e, ['ChainMismatchError', 'SwitchChainError', 'ChainNotConfiguredError']) ||
      matchesMessage(e, [/chain mismatch/i, /unrecognized chain/i, /unsupported chain/i]),
    )
  ) {
    return 'Wrong network. Please switch and try again.';
  }

  if (
    findInChain(chain, (e) =>
      matchesName(e, ['HttpRequestError', 'TimeoutError']) ||
      matchesMessage(e, [/http request failed/i, /failed to fetch/i, /timed out/i, /network ?error/i]),
    )
  ) {
    return 'Network error. Please try again.';
  }

  const reverted = findInChain(chain, (e) =>
    matchesName(e, ['ContractFunctionRevertedError']) ||
    matchesMessage(e, [/execution reverted/i, /reverted with reason/i]),
  );
  if (reverted) {
    const reason =
      (typeof reverted.shortMessage === 'string' && reverted.shortMessage) ||
      (typeof reverted.reason === 'string' && reverted.reason);
    return reason ? `Transaction reverted: ${reason}` : 'Transaction reverted.';
  }

  if (findInChain(chain, (e) => matchesMessage(e, [/nonce too low/i, /nonce has already been used/i]))) {
    return 'Transaction nonce error. Please try again.';
  }

  if (findInChain(chain, (e) => matchesMessage(e, [/replacement transaction underpriced/i, /gas price/i]))) {
    return 'Gas price too low. Please try again.';
  }

  const root = isObject(err) ? (err as Record<string, unknown>) : null;
  const shortMessage = root && typeof root.shortMessage === 'string' ? root.shortMessage : '';
  if (shortMessage) return shortMessage;

  const message = root && typeof root.message === 'string' ? root.message : err instanceof Error ? err.message : '';
  if (message) {
    const firstLine = message.split('\n')[0].trim();
    if (firstLine && firstLine.length < 200) return firstLine;
  }

  return 'An unexpected error occurred.';
}
