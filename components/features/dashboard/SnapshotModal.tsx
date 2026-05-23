'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input'; // si tu n'as pas ce composant, remplace par <input ... />
import DistributeFromWallet from './DistributeFromWallet';
import { notify } from '@/lib/notify';

type FrontRowBase = {
  address: string;
  balance_raw: string;
  balance: string;
  percent: string;
};
type FrontRowWithUsdc = FrontRowBase & { usdc_raw: string; usdc: string };
type FrontRow = FrontRowBase | FrontRowWithUsdc;

const SnapshotPanel = () => {
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<FrontRow[]>([]);
  const [totalUsdc, setTotalUsdc] = useState<string>('');

  const handleSnapshot = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalUsdc: totalUsdc.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Snapshot API error');
      }

      const file = `/snapshots/holders_snapshot.json?ts=${Date.now()}`;
      const jsonRes = await fetch(file, { cache: 'no-store' });
      if (!jsonRes.ok) throw new Error('Unable to read snapshot file');
      const data = (await jsonRes.json()) as FrontRow[];
      setRows(data);
    } catch (err) {
      notify.error(err);
    } finally {
      setRunning(false);
    }
  };

  const hasUSDC = rows.length > 0 && 'usdc' in rows[0];

  return (
    <div className="w-1/2 space-y-6 m-16">
      <div className="flex gap-6 items-start">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm text-black font-medium">USDC to distribute (optional)</label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="ex: 1000"
              value={totalUsdc}
              onChange={(e) => setTotalUsdc(e.target.value)}
              min="0"
              className="w-64 text-black bg-white"
            />
          </div>

          <Button onClick={handleSnapshot} disabled={running}>
            {running ? 'Generation…' : 'Snapshot'}
          </Button>

          {rows.length === 0 && <p className="text-sm text-gray-800">Run snapshot to get holders.</p>}

          {rows.length > 0 && (
            <div className="pt-4">
              <DistributeFromWallet />
            </div>
          )}
        </div>

        <div className="md:col-span-2 rounded-lg border shadow-sm overflow-x-auto">
          {rows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="text-black">Addresse</TableHead>
                  <TableHead className="text-right text-black">Balance TFT_001</TableHead>
                  <TableHead className="text-right text-black">Part (%)</TableHead>
                  {hasUSDC && <TableHead className="text-right text-black">USDC (approx.)</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={r.address} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                    <TableCell className="font-mono text-black">{r.address}</TableCell>
                    <TableCell className="text-right text-black">{r.balance}</TableCell>
                    <TableCell className="text-right text-black">{r.percent}</TableCell>
                    {hasUSDC && <TableCell className="text-right text-black">{(r as FrontRowWithUsdc).usdc}</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
};

export default SnapshotPanel;
