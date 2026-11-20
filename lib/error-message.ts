// Readable message for anything a `catch` can receive.
//
// The Stellar SDK's JSON-RPC client throws the raw error object of the RPC
// response — `{ code: -32600, message: "startLedger must be within the ledger
// range: …" }` — not an `Error`. Code that only reads `error.message` behind
// `instanceof Error` loses those: logs show "[object Object]" and pattern
// matches on the message (out-of-range cursor, resource limits) never fire.

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export function errorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === 'string') return error || fallback;
  if (isRecord(error) && typeof error.message === 'string' && error.message) {
    const code = error.code;
    const hasCode = (typeof code === 'number' || typeof code === 'string') && !error.message.includes(String(code));
    return hasCode ? `[${code}] ${error.message}` : error.message;
  }
  if (error == null) return fallback;
  try {
    return JSON.stringify(error) ?? fallback;
  } catch {
    return String(error);
  }
}
