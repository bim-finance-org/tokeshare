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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    <div className="mx-auto mt-10 w-full max-w-4xl rounded-lg border p-6 text-black">
      <h2 className="text-xl font-bold">Stellar — revenue distributions</h2>
      <p className="mt-1 text-sm text-gray-600">
        Snapshot the holders, preview the split, then distribute the month&apos;s USDC in one go.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-sm">
          Asset
          <select
            className="mt-1 h-9 rounded-md border px-2"
            value={slug}
            onChange={(e) => selectAsset(e.target.value)}
          >
            {ASSETS.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.symbol} · {a.network}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Total USDC
          <Input
            className="mt-1 w-36"
            placeholder="68.60"
            value={totalUsdc}
            onChange={(e) => setTotalUsdc(e.target.value)}
          />
        </label>
        <label className="flex flex-col text-sm">
          Claim window (days)
          <Input className="mt-1 w-28" value={expiresDays} onChange={(e) => setExpiresDays(e.target.value)} />
        </label>
        <Button onClick={handlePreview} disabled={busy !== null || !totalUsdc}>
          {busy === 'preview' ? 'Snapshotting…' : 'Preview snapshot'}
        </Button>
      </div>

      {preview && (
        <div className="mt-6">
          <div className="text-sm text-gray-600">
            Ledger {preview.snapshotLedger} · {preview.lines.length} holders ·{' '}
            {stroopsToUnits(BigInt(preview.eligibleShares))} eligible shares · dust{' '}
            {stroopsToUnits(BigInt(preview.dust))} USDC
            {preview.excluded.length > 0 && <> · excluded: {preview.excluded.map(short).join(', ')}</>}
          </div>
          <Table className="mt-2">
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">USDC</TableHead>
                <TableHead>Payout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.lines.map((line) => (
                <TableRow key={line.address}>
                  <TableCell className="font-mono text-xs">{short(line.address)}</TableCell>
                  <TableCell className="text-right">{stroopsToUnits(BigInt(line.shares))}</TableCell>
                  <TableCell className="text-right">{stroopsToUnits(BigInt(line.amount))}</TableCell>
                  <TableCell>
                    {line.push ? (
                      <span className="text-green-700">push</span>
                    ) : (
                      <span className="text-amber-600">no trustline → claim</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button className="mt-4" onClick={handleExecute} disabled={busy !== null}>
            {busy === 'execute'
              ? 'Distributing…'
              : `Distribute ${totalUsdc} USDC to ${preview.lines.length} holders`}
          </Button>
          <p className="mt-1 text-xs text-amber-700">
            Publishing this split on-chain is irreversible — check the table first.
          </p>
        </div>
      )}

      {result && asset && (
        <div className="mt-6 rounded-md border border-green-300 bg-green-50 p-4 text-sm">
          <div className="font-semibold">Cycle #{result.cycleId} executed</div>
          <div>
            {result.pushedCount} holders paid · {result.claimableCount} left to claim · window closes{' '}
            {new Date(result.expiresAt).toLocaleDateString()}
          </div>
          <div className="mt-1 flex flex-wrap gap-3">
            <a
              className="text-blue-700 underline"
              href={explorerTxUrl(asset.network, result.createTx)}
              target="_blank"
              rel="noreferrer"
            >
              create_cycle
            </a>
            {result.pushTxs.map((hash, i) => (
              <a
                key={hash}
                className="text-blue-700 underline"
                href={explorerTxUrl(asset.network, hash)}
                target="_blank"
                rel="noreferrer"
              >
                batch {i + 1}
              </a>
            ))}
          </div>
        </div>
      )}

      {cycles.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold">Past cycles</h3>
          <Table className="mt-2">
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead className="text-right">Total USDC</TableHead>
                <TableHead className="text-right">Paid out</TableHead>
                <TableHead className="text-right">Holders</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((c) => (
                <TableRow key={`${c.network}-${c.cycleId}`}>
                  <TableCell>{c.cycleId}</TableCell>
                  <TableCell className="text-right">{stroopsToUnits(BigInt(c.total))}</TableCell>
                  <TableCell className="text-right">{stroopsToUnits(BigInt(c.claimed))}</TableCell>
                  <TableCell className="text-right">
                    {c.paidCount}/{c.entryCount}
                  </TableCell>
                  <TableCell>
                    {c.sweptAt
                      ? 'swept'
                      : c.expired
                        ? 'expired'
                        : c.claimableCount > 0
                          ? `${c.claimableCount} claimable`
                          : 'settled'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default StellarDistributions;
