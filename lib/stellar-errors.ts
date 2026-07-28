// Maps RWA-token on-chain contract errors to readable messages. The token rejects
// non-compliant transfers with typed errors that surface in the thrown message as
// `Error(Contract, #NNN)`; we translate the codes we know about.

const CONTRACT_ERROR_MESSAGES: Record<number, string> = {
  113: 'Your address is not yet allowlisted for this asset.',
  114: 'Your address is blocked by the issuer for this asset.',
  302: 'Your holdings are frozen.',
  303: 'Some of your shares are frozen.',
  1000: 'Trading is currently paused by the issuer.',
};

/** Extracts a known contract error message from a thrown error, if any. */
export function parseContractError(error: unknown): string | undefined {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const match = message.match(/Error\(Contract,\s*#(\d+)\)/);
  if (!match) return undefined;
  return CONTRACT_ERROR_MESSAGES[Number(match[1])];
}

/** Best-effort human-readable message for any Stellar/contract error. */
export function toReadableStellarError(error: unknown): string {
  return parseContractError(error) ?? (error instanceof Error ? error.message : 'Unknown error');
}
