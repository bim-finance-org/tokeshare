'use client';

// Operator console for Stellar revenue distributions (tranche 2).
//
// One payout = one "round", in two mandatory steps: preview the exact split
// (fresh balances + trustline checks, nothing written), then execute. Where
// an SDP instance serves the network, holders with a USDC trustline are paid
// by an SDP disbursement and the others get a distributor claim cycle; without
// SDP, the distributor pushes (distribute_for) as before. A round that stops
// mid-way can be resumed; failed SDP payments can be moved to the claim path.

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ExternalLink, HandCoins } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ConsoleCard, { FieldLabel, Stat } from './ConsoleCard';
import { STELLAR_ASSETS, isAssetConfigured } from '@/config/stellar-assets';
import { explorerTxUrl, stroopsToUnits } from '@/lib/stellar';
import { notify } from '@/lib/notify';

type Network = 'testnet' | 'mainnet';
type PayoutChannel = 'sdp' | 'push' | 'claim';
type RoundStatus = 'planned' | 'submitted' | 'settled' | 'attention';
type LineState = 'paid' | 'pending' | 'claimable' | 'failed';

interface Preview {
  network: Network;
  channel: 'sdp' | 'contract';
  snapshotLedger: number;
  eligibleShares: string;
  dust: string;
  excluded: string[];
  lines: { address: string; shares: string; amount: string; channel: PayoutChannel }[];
  totals: Record<PayoutChannel, string>;
  sdpTopUp: string | null;
}

interface RoundLine {
  address: string;
  shares: string;
  amount: string;
  channel: PayoutChannel;
  state: LineState;
  sdpStatus: string | null;
  tx: string | null;
  error: string | null;
  doublePaid: boolean;
}

interface Round {
  id: string;
  network: Network;
  channel: 'sdp' | 'contract';
  status: RoundStatus;
  total: string;
  dust: string;
  claimExpiresAt: string;
  createdAt: string;
  fundingTx: string | null;
  sdpDisbursementId: string | null;
  sdpUrl: string | null;
  lastError: string | null;
  cycles: { cycleId: number; createdTx: string | null }[];
  counts: { holders: number; paid: number; pending: number; claimable: number; failed: number; paidAmount: string };
  lines: RoundLine[];
}

const ASSETS = STELLAR_ASSETS.filter(isAssetConfigured);
const short = (address: string) => `${address.slice(0, 6)}…${address.slice(-6)}`;
const usdc = (stroops: string) => stroopsToUnits(BigInt(stroops));

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

const pill = 'rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset';
const tones = {
  green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  blue: 'bg-blue-50 text-blue-600 ring-blue-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  red: 'bg-red-50 text-red-600 ring-red-100',
  gray: 'bg-gray-100 text-gray-500 ring-gray-200',
};

const CHANNEL_LABEL: Record<PayoutChannel, { label: string; tone: string }> = {
  sdp: { label: 'SDP', tone: tones.green },
  push: { label: 'push', tone: tones.green },
  claim: { label: 'no trustline → claim', tone: tones.amber },
};

const ROUND_STATUS: Record<RoundStatus, { label: string; tone: string }> = {
  planned: { label: 'stopped', tone: tones.red },
  submitted: { label: 'in flight', tone: tones.blue },
  settled: { label: 'settled', tone: tones.green },
  attention: { label: 'attention', tone: tones.red },
};

const LINE_STATE: Record<LineState, string> = {
  paid: tones.green,
  pending: tones.blue,
  claimable: tones.amber,
  failed: tones.red,
};

const TxLink = ({ network, hash, label }: { network: Network; hash: string; label: string }) => (
  <a
    href={explorerTxUrl(network, hash)}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-color4 ring-1 ring-inset ring-black/10 transition-colors hover:bg-color1"
  >
    {label}
    <ExternalLink className="h-3 w-3" />
  </a>
);

const RoundDetails = ({
  round,
  busy,
  onAdvance,
  onReroute,
}: {
  round: Round;
  busy: boolean;
  onAdvance: () => void;
  onReroute: () => void;
}) => {
  const failedSdp = round.lines.filter((l) => l.channel === 'sdp' && l.state === 'failed').length;
  const doublePaid = round.lines.filter((l) => l.doublePaid);
  return (
    <div className="space-y-3 bg-color1/40 px-4 py-4">
      {round.lastError && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 ring-1 ring-inset ring-red-100">
          {round.lastError}
        </p>
      )}
      {doublePaid.length > 0 && (
        <p className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {doublePaid.length} line(s) re-routed to claim were ALSO paid by the SDP (retried from the SDP dashboard):{' '}
          {doublePaid.map((l) => short(l.address)).join(' · ')}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {round.fundingTx && <TxLink network={round.network} hash={round.fundingTx} label="SDP top-up" />}
        {round.cycles.map((c) =>
          c.createdTx ? (
            <TxLink key={c.cycleId} network={round.network} hash={c.createdTx} label={`claim cycle #${c.cycleId}`} />
          ) : (
            <span key={c.cycleId} className={`${pill} ${tones.gray}`}>
              cycle #{c.cycleId} (unconfirmed)
            </span>
          ),
        )}
        {round.sdpUrl && (
          <a
            href={round.sdpUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-color4 ring-1 ring-inset ring-black/10 transition-colors hover:bg-color1"
          >
            SDP disbursement
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {!round.sdpUrl && round.sdpDisbursementId && (
          <span className={`${pill} ${tones.gray}`}>SDP {round.sdpDisbursementId.slice(0, 8)}…</span>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-black/5">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={headClass}>Address</TableHead>
              <TableHead className={`${headClass} text-right`}>USDC</TableHead>
              <TableHead className={headClass}>Channel</TableHead>
              <TableHead className={headClass}>State</TableHead>
              <TableHead className={headClass}>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {round.lines.map((line) => (
              <TableRow key={line.address} className="hover:bg-color1/60">
                <TableCell className="font-mono text-xs text-gray-600">{short(line.address)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums text-color4">{usdc(line.amount)}</TableCell>
                <TableCell>
                  <span className={`${pill} ${CHANNEL_LABEL[line.channel].tone}`}>
                    {line.sdpStatus === 'rerouted' ? 'SDP → claim' : CHANNEL_LABEL[line.channel].label}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`${pill} ${LINE_STATE[line.state]}`}>{line.state}</span>
                </TableCell>
                <TableCell className="max-w-xs truncate text-xs text-gray-500" title={line.error ?? undefined}>
                  {line.tx ? (
                    <a
                      href={explorerTxUrl(round.network, line.tx)}
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-color4"
                    >
                      tx
                    </a>
                  ) : (
                    (line.error ?? '')
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {round.status === 'planned' && (
          <button
            type="button"
            onClick={onAdvance}
            disabled={busy}
            className="h-10 rounded-full bg-color4 px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Resuming…' : 'Resume round'}
          </button>
        )}
        {failedSdp > 0 && (
          <>
            <button
              type="button"
              onClick={onReroute}
              disabled={busy}
              className="h-10 rounded-full bg-color4 px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Re-routing…' : `Move ${failedSdp} failed payment(s) to claim`}
            </button>
            <p className="text-xs text-amber-600">
              Never retry these payments from the SDP dashboard once moved — the holder would be paid twice.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

const StellarDistributions = () => {
  const [slug, setSlug] = useState(ASSETS[0]?.slug ?? '');
  const [totalUsdc, setTotalUsdc] = useState('');
  const [expiresDays, setExpiresDays] = useState('90');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<'preview' | 'execute' | string | null>(null);
  const [openRound, setOpenRound] = useState<string | null>(null);

  const roundsQuery = useQuery({
    queryKey: ['stellar-admin-rounds', slug],
    enabled: !!slug,
    // While SDP payments are in flight, follow them.
    refetchInterval: (query) => ((query.state.data ?? []).some((r) => r.status === 'submitted') ? 15_000 : false),
    queryFn: async (): Promise<Round[]> => {
      const res = await fetch(`/api/stellar/admin/rounds?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) return [];
      const payload = (await res.json()) as { rounds?: Round[] };
      return payload.rounds ?? [];
    },
  });
  const rounds = roundsQuery.data ?? [];

  const selectAsset = (next: string) => {
    setSlug(next);
    setPreview(null);
    setOpenRound(null);
  };

  const handlePreview = async () => {
    setBusy('preview');
    try {
      setPreview(await postJson<Preview>('/api/stellar/admin/rounds/preview', { slug, totalUsdc }));
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
      const round = await postJson<Round>('/api/stellar/admin/rounds', {
        slug,
        totalUsdc,
        expiresDays: Number(expiresDays) || 90,
      });
      setPreview(null);
      setOpenRound(round.id);
      notify.success(
        `Round submitted — ${round.counts.paid + round.counts.pending} paid or in flight, ${round.counts.claimable} left to claim`,
      );
    } catch (err) {
      notify.error(err);
      setPreview(null);
    } finally {
      setBusy(null);
      void roundsQuery.refetch();
    }
  };

  const runOnRound = async (roundId: string, action: 'advance' | 'reroute') => {
    setBusy(roundId);
    try {
      await postJson(`/api/stellar/admin/rounds/${roundId}/${action}`, {});
      notify.success(action === 'advance' ? 'Round resumed' : 'Failed payments moved to the claim path');
    } catch (err) {
      notify.error(err);
    } finally {
      setBusy(null);
      void roundsQuery.refetch();
    }
  };

  const asset = ASSETS.find((a) => a.slug === slug);
  const sdpMode = preview?.channel === 'sdp';

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
          <Input
            className={`${inputClass} w-32`}
            value={expiresDays}
            onChange={(e) => setExpiresDays(e.target.value)}
          />
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
            {sdpMode ? (
              <>
                <Stat label="Paid by the SDP" value={`${usdc(preview.totals.sdp)} USDC`} />
                <Stat label="Left to claim" value={`${usdc(preview.totals.claim)} USDC`} />
                <Stat label="SDP top-up" value={`${usdc(preview.sdpTopUp ?? '0')} USDC`} />
              </>
            ) : (
              <>
                <Stat label="Pushed on-chain" value={`${usdc(preview.totals.push)} USDC`} />
                <Stat label="Left to claim" value={`${usdc(preview.totals.claim)} USDC`} />
                <Stat label="Rounding dust" value={`${usdc(preview.dust)} USDC`} />
              </>
            )}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            {sdpMode
              ? 'Channel: Stellar Disbursement Platform (one payment per holder) + distributor claim cycle for holders without a USDC trustline.'
              : 'No SDP on this network — channel: distributor cycle (distribute_for push + claim).'}{' '}
            Snapshot ledger {preview.snapshotLedger.toLocaleString('en-US')}.
            {preview.excluded.length > 0 &&
              ` Excluded (inventory / operator / venues): ${preview.excluded.map(short).join(' · ')}.`}
          </p>

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
                    <TableCell className="text-right tabular-nums text-gray-500">{usdc(line.shares)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-color4">
                      {usdc(line.amount)}
                    </TableCell>
                    <TableCell>
                      <span className={`${pill} ${CHANNEL_LABEL[line.channel].tone}`}>
                        {CHANNEL_LABEL[line.channel].label}
                      </span>
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
              {busy === 'execute' ? 'Distributing…' : `Distribute ${totalUsdc} USDC to ${preview.lines.length} holders`}
            </button>
            <p className="text-xs text-amber-600">Payments and published roots are final — check the table first.</p>
          </div>
        </div>
      )}

      {/* Rounds */}
      {rounds.length > 0 && (
        <div className="mt-8">
          <FieldLabel>Payouts</FieldLabel>
          <div className="mt-2 overflow-x-auto rounded-2xl ring-1 ring-black/5">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={headClass}>Date</TableHead>
                  <TableHead className={headClass}>Channel</TableHead>
                  <TableHead className={`${headClass} text-right`}>Total USDC</TableHead>
                  <TableHead className={`${headClass} text-right`}>Delivered</TableHead>
                  <TableHead className={`${headClass} text-right`}>Holders paid</TableHead>
                  <TableHead className={headClass}>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rounds.map((round) => {
                  const status = ROUND_STATUS[round.status];
                  const open = openRound === round.id;
                  return (
                    <React.Fragment key={round.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-color1/60"
                        onClick={() => setOpenRound(open ? null : round.id)}
                      >
                        <TableCell className="text-color4">{new Date(round.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs uppercase text-gray-500">{round.channel}</TableCell>
                        <TableCell className="text-right tabular-nums text-color4">
                          {usdc((BigInt(round.total) - BigInt(round.dust)).toString())}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-gray-500">
                          {usdc(round.counts.paidAmount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-gray-500">
                          {round.counts.paid}/{round.counts.holders}
                          {round.counts.claimable > 0 && (
                            <span className="ml-1 text-xs text-amber-600">({round.counts.claimable} to claim)</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`${pill} ${status.tone}`}>{status.label}</span>
                        </TableCell>
                      </TableRow>
                      {open && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={6} className="p-0">
                            <RoundDetails
                              round={round}
                              busy={busy === round.id}
                              onAdvance={() => runOnRound(round.id, 'advance')}
                              onReroute={() => runOnRound(round.id, 'reroute')}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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
