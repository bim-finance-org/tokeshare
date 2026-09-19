'use client';

import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ConsoleCard, { FieldLabel } from './ConsoleCard';
import DistributeFromWallet from './DistributeFromWallet';
import { notify } from '@/lib/notify';
import { MARKETPLACE_TOKEN_SYMBOLS, TOKENS, type MarketplaceTokenSymbol } from '@/config/token';

type FrontRowBase = {
  address: string;
  balance_raw: string;
  balance: string;
  percent: string;
};
type FrontRowWithUsdc = FrontRowBase & { usdc_raw: string; usdc: string };
type FrontRow = FrontRowBase | FrontRowWithUsdc;

const SnapshotPanel = () => {
  const [token, setToken] = useState<MarketplaceTokenSymbol>('TFT_001');
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<FrontRow[]>([]);
  const [totalUsdc, setTotalUsdc] = useState<string>('');

  // A snapshot only makes sense for the token it was taken for.
  const selectToken = (next: MarketplaceTokenSymbol) => {
    if (next === token) return;
    setToken(next);
    setRows([]);
  };

  const handleSnapshot = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          totalUsdc: totalUsdc.trim() || null,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        rows?: FrontRow[];
        error?: string;
      };
      if (!res.ok || !payload.rows) {
        throw new Error(payload.error || 'Snapshot API error');
      }
      setRows(payload.rows);
    } catch (err) {
      notify.error(err);
    } finally {
      setRunning(false);
    }
  };

  const hasUSDC = rows.length > 0 && 'usdc' in rows[0];

  return (
    <ConsoleCard
      icon={Camera}
      title={`${token} · Base`}
      subtitle="Holder snapshot & USDC distribution from the operator wallet"
      aside={
        <div className="flex gap-1 rounded-full bg-color1 p-1 ring-1 ring-inset ring-black/5">
          {MARKETPLACE_TOKEN_SYMBOLS.map((symbol) => {
            const active = symbol === token;
            return (
              <button
                key={symbol}
                type="button"
                onClick={() => selectToken(symbol)}
                disabled={running}
                title={TOKENS[symbol]?.name}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  active ? 'bg-color4 text-white shadow-sm' : 'text-gray-500 hover:text-color4'
                }`}
              >
                {symbol}
              </button>
            );
          })}
        </div>
      }
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <FieldLabel>USDC to distribute (optional)</FieldLabel>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="ex: 1000"
            value={totalUsdc}
            onChange={(e) => setTotalUsdc(e.target.value)}
            min="0"
            className="h-11 w-48 rounded-xl border-0 bg-color1 text-color4 ring-1 ring-inset ring-black/5 focus-visible:ring-2 focus-visible:ring-color4"
          />
        </label>
        <button
          type="button"
          onClick={handleSnapshot}
          disabled={running}
          className="h-11 rounded-full bg-color4 px-6 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? 'Snapshotting…' : 'Run snapshot'}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-black/10 px-5 py-6 text-center text-sm text-gray-400">
          Run a snapshot to list the current {token} holders.
        </p>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl ring-1 ring-black/5">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Address
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Balance {token}
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Share
                  </TableHead>
                  {hasUSDC && (
                    <TableHead className="text-right text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      USDC
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.address} className="hover:bg-color1/60">
                    <TableCell className="font-mono text-xs text-gray-600">{r.address}</TableCell>
                    <TableCell className="text-right tabular-nums text-color4">{r.balance}</TableCell>
                    <TableCell className="text-right tabular-nums text-gray-500">{r.percent}%</TableCell>
                    {hasUSDC && (
                      <TableCell className="text-right font-medium tabular-nums text-color4">
                        {(r as FrontRowWithUsdc).usdc}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-5">
            <DistributeFromWallet token={token} />
          </div>
        </>
      )}
    </ConsoleCard>
  );
};

export default SnapshotPanel;
