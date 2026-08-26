'use client';

// Operator console for Stellar revenue distributions (tranche 2).
//
// One cycle = one click, in two mandatory steps: preview the exact payout
// table (fresh balances + trustline checks, nothing on-chain), then execute —
// the server signs create_cycle and the distribute_for batches. Holders
// without a USDC trustline are flagged: they are left out of the push and
// will claim from their portfolio instead.

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, HandCoins } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ConsoleCard, { FieldLabel, Stat } from './ConsoleCard';
import { STELLAR_ASSETS, isAssetConfigured } from '@/config/stellar-assets';
import { explorerTxUrl, stroopsToUnits } from '@/lib/stellar';
import { notify } from '@/lib/notify';

interface PreviewLine {
  address: string;
  shares: string;
  amount: string;
  push: boolean;
}

interface Preview {
  network: 'testnet' | 'mainnet';
  snapshotLedger: number;
  eligibleShares: string;
  dust: string;
  excluded: string[];
  lines: PreviewLine[];
}

interface CycleResult {
  cycleId: number;
  createTx: string;
  pushTxs: string[];
  pushedCount: number;
  claimableCount: number;
  expiresAt: string;
}

interface CycleRow {
  cycleId: number;
  network: 'testnet' | 'mainnet';
  total: string;
  claimed: string;
  expiresAt: string;
  sweptAt: string | null;
  entryCount: number;
  paidCount: number;
  claimableCount: number;
  /** Derived at load time (render must stay pure). */
  expired: boolean;
}

const ASSETS = STELLAR_ASSETS.filter(isAssetConfigured);
const short = (address: string) => `${address.slice(0, 6)}…${address.slice(-6)}`;

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(payload.error || 'Request failed');
  return payload;
}

const inputClass =
  'h-11 rounded-xl border-0 bg-color1 text-color4 ring-1 ring-inset ring-black/5 focus-visible:ring-2 focus-visible:ring-color4';

const headClass = 'text-[11px] font-medium uppercase tracking-wide text-gray-400';

const cycleStatus = (c: CycleRow): { label: string; tone: string } => {
  if (c.sweptAt) return { label: 'swept', tone: 'bg-gray-100 text-gray-500 ring-gray-200' };
  if (c.expired) return { label: 'expired', tone: 'bg-amber-50 text-amber-600 ring-amber-100' };
  if (c.claimableCount > 0)
    return { label: `${c.claimableCount} claimable`, tone: 'bg-blue-50 text-blue-600 ring-blue-100' };
  return { label: 'settled', tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100' };
};

const StellarDistributions = () => {
  const [slug, setSlug] = useState(ASSETS[0]?.slug ?? '');
  const [totalUsdc, setTotalUsdc] = useState('');
  const [expiresDays, setExpiresDays] = useState('90');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<CycleResult | null>(null);
  const [busy, setBusy] = useState<'preview' | 'execute' | null>(null);

  const cyclesQuery = useQuery({
    queryKey: ['stellar-admin-cycles', slug],
    enabled: !!slug,
    queryFn: async (): Promise<CycleRow[]> => {
      const res = await fetch(`/api/stellar/assets/${slug}/distributions`);
      if (!res.ok) return [];
      const payload = (await res.json()) as { cycles?: Omit<CycleRow, 'expired'>[] };
      const now = Date.now();
      return (payload.cycles ?? []).map((c) => ({ ...c, expired: new Date(c.expiresAt).getTime() < now }));
    },
  });
  const cycles = cyclesQuery.data ?? [];

  const selectAsset = (next: string) => {
    setSlug(next);
    setPreview(null);
    setResult(null);
  };

  const handlePreview = async () => {
    setBusy('preview');
    setResult(null);
    try {
      setPreview(await postJson<Preview>('/api/stellar/admin/cycles/preview', { slug, totalUsdc }));
    } catch (err) {
      notify.error(err);
      setPreview(null);
    } finally {
      setBusy(null);
    }
  };

  const handleExecute = async () => {
    if (!preview) return;
    setBusy('execute');
    try {
      const res = await postJson<CycleResult>('/api/stellar/admin/cycles', {
        slug,
        totalUsdc,
        expiresDays: Number(expiresDays) || 90,
      });
      setResult(res);
      setPreview(null);
      notify.success(`Cycle #${res.cycleId} distributed — ${res.pushedCount} paid, ${res.claimableCount} left to claim`);
      void cyclesQuery.refetch();
    } catch (err) {
      notify.error(err);
    } finally {
      setBusy(null);
    }
  };

  const asset = ASSETS.find((a) => a.slug === slug);

  return (
    <ConsoleCard
      icon={HandCoins}
      title="Stellar · Revenue distributions"
      subtitle="Snapshot the holders, preview the split, distribute the month's USDC in one go"
      aside={
        asset && (
          <span className="rounded-full bg-color1 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-color4 ring-1 ring-inset ring-black/5">
            {asset.network}
          </span>
        )
      }
    >
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <FieldLabel>Asset</FieldLabel>
          <select className={`${inputClass} px-3`} value={slug} onChange={(e) => selectAsset(e.target.value)}>
            {ASSETS.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.symbol} · {a.network}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <FieldLabel>Total USDC</FieldLabel>
          <Input
            className={`${inputClass} w-36`}
            placeholder="68.60"
            value={totalUsdc}
            onChange={(e) => setTotalUsdc(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <FieldLabel>Claim window (days)</FieldLabel>
          <Input className={`${inputClass} w-32`} value={expiresDays} onChange={(e) => setExpiresDays(e.target.value)} />
        </label>
        <button
          type="button"
          onClick={handlePreview}
          disabled={busy !== null || !totalUsdc}
          className="h-11 rounded-full bg-color4 px-6 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === 'preview' ? 'Snapshotting…' : 'Preview snapshot'}
        </button>
      </div>

      {/* Preview */}
      {preview && (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Holders" value={preview.lines.length} />
            <Stat label="Eligible shares" value={stroopsToUnits(BigInt(preview.eligibleShares))} />
            <Stat label="Rounding dust" value={`${stroopsToUnits(BigInt(preview.dust))} USDC`} />
            <Stat label="Snapshot ledger" value={preview.snapshotLedger.toLocaleString('en-US')} />
          </div>
          {preview.excluded.length > 0 && (
            <p className="mt-3 text-xs text-gray-400">
              Excluded from the tree (inventory / operator): {preview.excluded.map(short).join(' · ')}
            </p>
          )}

          <div className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-black/5">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={headClass}>Address</TableHead>
                  <TableHead className={`${headClass} text-right`}>Shares</TableHead>
                  <TableHead className={`${headClass} text-right`}>USDC</TableHead>
                  <TableHead className={headClass}>Payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.lines.map((line) => (
                  <TableRow key={line.address} className="hover:bg-color1/60">
                    <TableCell className="font-mono text-xs text-gray-600">{short(line.address)}</TableCell>
                    <TableCell className="text-right tabular-nums text-gray-500">
                      {stroopsToUnits(BigInt(line.shares))}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-color4">
                      {stroopsToUnits(BigInt(line.amount))}
                    </TableCell>
                    <TableCell>
                      {line.push ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600 ring-1 ring-inset ring-emerald-100">
                          push
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600 ring-1 ring-inset ring-amber-100">
                          no trustline → claim
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExecute}
              disabled={busy !== null}
              className="h-11 rounded-full bg-color4 px-6 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === 'execute'
                ? 'Distributing…'
                : `Distribute ${totalUsdc} USDC to ${preview.lines.length} holders`}
            </button>
            <p className="text-xs text-amber-600">
              Publishing this split on-chain is irreversible — check the table first.
            </p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && asset && (
        <div className="mt-6 rounded-2xl bg-emerald-50 p-5 ring-1 ring-inset ring-emerald-100">
          <p className="font-titleSemibold text-emerald-800">Cycle #{result.cycleId} executed</p>
          <p className="mt-0.5 text-sm text-emerald-700">
            {result.pushedCount} holders paid · {result.claimableCount} left to claim · window closes{' '}
            {new Date(result.expiresAt).toLocaleDateString()}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[{ label: 'create_cycle', hash: result.createTx }, ...result.pushTxs.map((hash, i) => ({ label: `batch ${i + 1}`, hash }))].map(
              ({ label, hash }) => (
                <a
                  key={hash}
                  href={explorerTxUrl(asset.network, hash)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 transition-colors hover:bg-emerald-100"
                >
                  {label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ),
            )}
          </div>
        </div>
      )}

      {/* Past cycles */}
      {cycles.length > 0 && (
        <div className="mt-8">
          <FieldLabel>Past cycles</FieldLabel>
          <div className="mt-2 overflow-x-auto rounded-2xl ring-1 ring-black/5">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={headClass}>#</TableHead>
                  <TableHead className={`${headClass} text-right`}>Total USDC</TableHead>
                  <TableHead className={`${headClass} text-right`}>Paid out</TableHead>
                  <TableHead className={`${headClass} text-right`}>Holders</TableHead>
                  <TableHead className={headClass}>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles.map((c) => {
                  const status = cycleStatus(c);
                  return (
                    <TableRow key={`${c.network}-${c.cycleId}`} className="hover:bg-color1/60">
                      <TableCell className="font-medium text-color4">{c.cycleId}</TableCell>
                      <TableCell className="text-right tabular-nums text-color4">
                        {stroopsToUnits(BigInt(c.total))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-gray-500">
                        {stroopsToUnits(BigInt(c.claimed))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-gray-500">
                        {c.paidCount}/{c.entryCount}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${status.tone}`}
                        >
                          {status.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </ConsoleCard>
  );
};

export default StellarDistributions;
