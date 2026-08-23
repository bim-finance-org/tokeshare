// Event decoding: RPC getEvents payloads → JSON-safe rows for StellarEvent.
//
// Everything is stored raw-but-readable (strkeys, decimal strings, hex) so the
// derivation pass and any later backfill logic can re-interpret events without
// touching XDR again.

import { Address, scValToNative, xdr } from '@stellar/stellar-sdk';

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Recursively converts scValToNative output into JSON-safe values. */
export function toJsonSafe(value: unknown): Json {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Uint8Array) return Buffer.from(value).toString('hex');
  if (value instanceof Address) return value.toString();
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (typeof value === 'object') {
    // Address-like objects from other sdk entry points.
    const maybe = value as { toString?: () => string; constructor?: { name?: string } };
    if (maybe.constructor?.name === 'Address' && maybe.toString) return maybe.toString();
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toJsonSafe(v)]));
  }
  return String(value);
}

const decodeScVal = (val: xdr.ScVal): Json => toJsonSafe(scValToNative(val));

/** One event as persisted (sans network, which the caller knows). */
export interface DecodedEvent {
  id: string;
  ledger: number;
  ledgerClosedAt: Date;
  contractId: string;
  txHash: string;
  /** First topic when it is a symbol (`transfer`, `paid`, …), else `other`. */
  kind: string;
  topics: Json[];
  data: Json;
}

/** Shape of the sdk's getEvents rows we rely on — kept loose on purpose. */
export interface RawRpcEvent {
  id: string;
  ledger: number;
  ledgerClosedAt: string;
  contractId?: { contractId(): string } | string;
  topic: xdr.ScVal[];
  value: xdr.ScVal;
  txHash: string;
  inSuccessfulContractCall?: boolean;
}

export function decodeEvent(raw: RawRpcEvent): DecodedEvent {
  const contractId =
    typeof raw.contractId === 'string' ? raw.contractId : (raw.contractId?.contractId() ?? '');
  const topics = raw.topic.map(decodeScVal);
  const kind = typeof topics[0] === 'string' ? topics[0] : 'other';
  return {
    id: raw.id,
    ledger: raw.ledger,
    ledgerClosedAt: new Date(raw.ledgerClosedAt),
    contractId,
    txHash: raw.txHash,
    kind,
    topics,
    data: decodeScVal(raw.value),
  };
}
