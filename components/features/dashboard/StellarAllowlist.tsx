'use client';

// Operator console for the RWA token's allowlist.
//
// The token only moves between allowlisted addresses. Buyers are allowlisted
// by the sale contract on their first purchase; two kinds of addresses are
// allowlisted by hand, from here:
// - the secondary-market venues of an asset (liquidity pools, and routers
//   that hold the token during a swap) — to do BEFORE liquidity is added;
// - investors who never bought on the sale and want to trade on a pool.
//
// Allowing an address signs an on-chain transaction with the operator
// account, so every allow goes through a check and an explicit confirmation.

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StrKey } from '@stellar/stellar-sdk';
import { ExternalLink, UserCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ConsoleCard, { FieldLabel } from './ConsoleCard';
import { STELLAR_ASSETS, isAssetConfigured, type StellarAsset } from '@/config/stellar-assets';
import { explorerTxUrl } from '@/lib/stellar';
import { notify } from '@/lib/notify';

interface VenueEntry {
  venue: string;
  role: 'pool' | 'router';
  label: string;
  /** Empty while the pool has not been created. */
  address: string;
  /** null = no address to check yet. */
  allowed: boolean | null;
}

interface Receipt {
  address: string;
  txHash: string;
}

const ENDPOINT = '/api/stellar/admin/allowlist';
const ASSETS = STELLAR_ASSETS.filter(isAssetConfigured);

const short = (address: string) => `${address.slice(0, 6)}…${address.slice(-6)}`;
const isAddress = (value: string) => StrKey.isValidEd25519PublicKey(value) || StrKey.isValidContract(value);

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const payload = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(payload.error || `Request failed (${res.status})`);
  return payload;
}

const inputClass =
  'h-11 rounded-xl border-0 bg-color1 text-color4 ring-1 ring-inset ring-black/5 focus-visible:ring-2 focus-visible:ring-color4';

const pill = 'rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset';
const tones = {
  green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  gray: 'bg-gray-100 text-gray-500 ring-gray-200',
};

const primaryButton =
  'h-10 rounded-full bg-color4 px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60';
const secondaryButton =
  'h-10 rounded-full bg-white px-5 text-sm font-medium text-color4 ring-1 ring-inset ring-black/10 transition-colors hover:bg-color1 disabled:cursor-not-allowed disabled:opacity-60';

const StatusBadge = ({ allowed }: { allowed: boolean | null }) => {
  if (allowed === null) return <span className={`${pill} ${tones.gray}`}>not created yet</span>;
  return allowed ? (
    <span className={`${pill} ${tones.green}`}>allowed</span>
  ) : (
    <span className={`${pill} ${tones.amber}`}>not allowed</span>
  );
};

/** The confirmation step: the full address to re-read, then an explicit go. */
const ConfirmAllow = ({
  asset,
  address,
  busy,
  onConfirm,
  onCancel,
}: {
  asset: StellarAsset;
  address: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-inset ring-amber-100">
    <p className="text-sm text-amber-800">
      Allow this address to hold and transfer {asset.symbol} on {asset.network}? This signs an on-chain transaction with
      the operator account and cannot be undone from the console.
    </p>
    <code className="mt-2 block break-all rounded-xl bg-white px-3 py-2 text-xs text-color4 ring-1 ring-inset ring-black/5">
      {address}
    </code>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={onConfirm} disabled={busy} className={primaryButton}>
        {busy ? 'Allowing…' : 'Confirm — allow address'}
      </button>
      <button type="button" onClick={onCancel} disabled={busy} className={secondaryButton}>
        Cancel
      </button>
    </div>
  </div>
);

const StellarAllowlist = () => {
  const [slug, setSlug] = useState(ASSETS[0]?.slug ?? '');
  const [input, setInput] = useState('');
  /** Result of the last check of the investor field. */
  const [checked, setChecked] = useState<{ address: string; allowed: boolean } | null>(null);
  const [checking, setChecking] = useState(false);
  /** Address waiting for the operator's confirmation. */
  const [confirming, setConfirming] = useState<string | null>(null);
  /** Address whose allow transaction is in flight. */
  const [allowing, setAllowing] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const asset = ASSETS.find((a) => a.slug === slug);

  const venuesQuery = useQuery({
    queryKey: ['stellar-admin-allowlist', slug],
    enabled: !!slug,
    queryFn: async (): Promise<VenueEntry[]> =>
      (await request<{ venues: VenueEntry[] }>(`${ENDPOINT}?slug=${encodeURIComponent(slug)}`)).venues,
  });
  const venues = venuesQuery.data ?? [];

  const candidate = input.trim();
  const candidateValid = isAddress(candidate);

  const selectAsset = (next: string) => {
    setSlug(next);
    setChecked(null);
    setConfirming(null);
    setReceipts([]);
  };

  const editInput = (value: string) => {
    setInput(value);
    // A check only ever covers the exact address it was run on.
    setChecked(null);
    if (confirming && !venues.some((v) => v.address === confirming)) setConfirming(null);
  };

  const handleCheck = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!candidateValid) return;
    setChecking(true);
    try {
      const query = `slug=${encodeURIComponent(slug)}&address=${encodeURIComponent(candidate)}`;
      const { allowed } = await request<{ allowed: boolean }>(`${ENDPOINT}?${query}`);
      setChecked({ address: candidate, allowed });
    } catch (err) {
      notify.error(err);
      setChecked(null);
    } finally {
      setChecking(false);
    }
  };

  const allow = async (address: string) => {
    setAllowing(address);
    try {
      const { txHash } = await request<{ allowed: true; txHash: string | null }>(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, address }),
      });
      if (txHash) {
        setReceipts((previous) => [{ address, txHash }, ...previous]);
        notify.success('Address allowed', short(address));
      } else {
        notify.info('Already allowed', `${short(address)} — no transaction was needed.`);
      }
      if (checked?.address === address) setChecked({ address, allowed: true });
    } catch (err) {
      notify.error(err);
    } finally {
      setAllowing(null);
      setConfirming(null);
      void venuesQuery.refetch();
    }
  };

  if (!asset) return null;
  const busy = allowing !== null;

  return (
    <ConsoleCard
      icon={UserCheck}
      title="Stellar · Token allowlist"
      subtitle="Allow liquidity pools and investor addresses to hold and transfer the token"
      aside={
        <span className="rounded-full bg-color1 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-color4 ring-1 ring-inset ring-black/5">
          {asset.network}
        </span>
      }
    >
      <label className="flex w-fit flex-col gap-1.5">
        <FieldLabel>Asset</FieldLabel>
        <select
          className={`${inputClass} px-3`}
          value={slug}
          onChange={(e) => selectAsset(e.target.value)}
          disabled={busy || checking}
        >
          {ASSETS.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.symbol} · {a.network}
            </option>
          ))}
        </select>
      </label>

      {/* Venues */}
      <div className="mt-6">
        <FieldLabel>Secondary-market venues</FieldLabel>
        {venuesQuery.isLoading && <p className="mt-2 text-sm text-gray-500">Reading the allowlist…</p>}
        {venuesQuery.error && <p className="mt-2 text-sm text-red-600">{(venuesQuery.error as Error).message}</p>}
        {venuesQuery.data && venues.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">No venue is configured for this asset.</p>
        )}
        {venues.length > 0 && (
          <>
            <p className="mt-1 text-xs text-gray-400">
              Each pool, and each router that holds the token during a swap, must be allowed before liquidity is added.
              These addresses are left out of revenue distributions.
            </p>
            <ul className="mt-2 divide-y divide-gray-100">
              {venues.map((entry) => (
                <li key={`${entry.venue}:${entry.role}`} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-color4">{entry.label}</p>
                      <p className="mt-0.5 break-all font-mono text-xs text-gray-500">
                        {entry.address || 'Address unknown until the pool is created.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge allowed={entry.allowed} />
                      {entry.allowed === false && confirming !== entry.address && (
                        <button
                          type="button"
                          onClick={() => setConfirming(entry.address)}
                          disabled={busy}
                          className={primaryButton}
                        >
                          Allow
                        </button>
                      )}
                    </div>
                  </div>
                  {entry.allowed === false && confirming === entry.address && (
                    <ConfirmAllow
                      asset={asset}
                      address={entry.address}
                      busy={allowing === entry.address}
                      onConfirm={() => void allow(entry.address)}
                      onCancel={() => setConfirming(null)}
                    />
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Investor address */}
      <div className="mt-6">
        <FieldLabel>Allow an investor address</FieldLabel>
        <p className="mt-1 text-xs text-gray-400">
          Buyers on the primary sale are allowed automatically. Use this for an investor who has not bought there.
        </p>
        <form className="mt-2 flex flex-col gap-2 sm:flex-row" onSubmit={handleCheck}>
          <Input
            className={`${inputClass} flex-1 font-mono text-xs`}
            placeholder="G… account or C… contract address"
            value={input}
            onChange={(e) => editInput(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          <button type="submit" disabled={!candidateValid || checking || busy} className={`${primaryButton} h-11`}>
            {checking ? 'Checking…' : 'Check address'}
          </button>
        </form>
        {candidate && !candidateValid && (
          <p className="mt-2 text-xs text-amber-600">Not a valid Stellar account (G…) or contract (C…) address.</p>
        )}

        {checked && (
          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span className="font-mono text-xs">{short(checked.address)}</span>
              <StatusBadge allowed={checked.allowed} />
              {checked.allowed && <span className="text-xs text-gray-400">Nothing to do.</span>}
              {!checked.allowed && confirming !== checked.address && (
                <button
                  type="button"
                  onClick={() => setConfirming(checked.address)}
                  disabled={busy}
                  className={primaryButton}
                >
                  Allow this address
                </button>
              )}
            </div>
            {!checked.allowed && confirming === checked.address && (
              <ConfirmAllow
                asset={asset}
                address={checked.address}
                busy={allowing === checked.address}
                onConfirm={() => void allow(checked.address)}
                onCancel={() => setConfirming(null)}
              />
            )}
          </div>
        )}
      </div>

      {/* Allowed during this session */}
      {receipts.length > 0 && (
        <div className="mt-6">
          <FieldLabel>Allowed in this session</FieldLabel>
          <ul className="mt-2 divide-y divide-gray-100">
            {receipts.map((receipt) => (
              <li key={receipt.txHash} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="break-all font-mono text-xs text-gray-600">{receipt.address}</span>
                <a
                  href={explorerTxUrl(asset.network, receipt.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-color4 ring-1 ring-inset ring-black/10 transition-colors hover:bg-color1"
                >
                  transaction
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ConsoleCard>
  );
};

export default StellarAllowlist;
