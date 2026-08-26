'use client';

// Cash-in / cash-out panel (user dashboard): start SEP-24 deposits and
// withdrawals against the configured ramp anchor (MoneyGram in production),
// track their status, and send the USDC leg when a withdrawal asks for it.

import React from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RAMP_NETWORK, getRampAnchor } from '@/config/anchors';
import { useStellarAccount } from '@/context/StellarContext';
import { useRampHistory, useRampPolling, useSendWithdrawal, useStartRamp, type RampRecord } from '@/hooks/useRamp';
import { TERMINAL_SEP24_STATUSES } from '@/lib/sep/sep24';
import { notify } from '@/lib/notify';

const PROVIDER_LABELS: Record<string, string> = {
  moneygram: 'MoneyGram',
  testanchor: 'Test anchor (sandbox)',
};

function statusLabel(record: RampRecord): string {
  switch (record.status) {
    case 'incomplete':
      return 'Finish the steps in the provider window';
    case 'pending_user_transfer_start':
      return record.direction === 'deposit' ? 'Waiting for your cash deposit' : 'Ready — send your USDC';
    case 'pending_user_transfer_complete':
      return 'Funds received — finalizing';
    case 'completed':
      return record.direction === 'deposit' ? 'USDC received' : 'Cash ready for pickup';
    case 'refunded':
      return 'Refunded';
    case 'expired':
      return 'Expired';
    case 'error':
      return record.message || 'Failed';
    default:
      return 'Processing…';
  }
}

const StellarRampPanel = () => {
  const { isConnected } = useStellarAccount();
  const anchor = getRampAnchor(RAMP_NETWORK);
  const { data: records } = useRampHistory();
  const polling = useRampPolling(records ?? []);
  const start = useStartRamp();
  const send = useSendWithdrawal();

  if (!isConnected) return null;

  const active = (records ?? []).filter((r) => !TERMINAL_SEP24_STATUSES.has(r.status));
  const history = (records ?? []).filter((r) => TERMINAL_SEP24_STATUSES.has(r.status)).slice(0, 5);

  const handleStart = (direction: 'deposit' | 'withdrawal') => {
    // The popup must open synchronously in the click (popup blockers); the
    // hook navigates it to the anchor URL once the flow exists.
    const popup = window.open('', 'tokeshare-ramp', 'width=480,height=720');
    start
      .mutateAsync({ direction, popup })
      .catch((err) => notify.error(err));
  };

  const handleSend = async (record: RampRecord) => {
    try {
      const hash = await send.mutateAsync(record);
      notify.success(`USDC sent — tx ${hash.slice(0, 8)}…`);
    } catch (err) {
      notify.error(err);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-color1 text-color4">
            <Banknote className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-titleSemibold text-lg text-color4">Cash in / Cash out</h2>
            <p className="text-xs text-gray-500">via {PROVIDER_LABELS[anchor.provider] ?? anchor.homeDomain}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={() => handleStart('deposit')} disabled={start.isPending}>
          <ArrowDownToLine className="mr-1.5 h-4 w-4" />
          Deposit cash
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleStart('withdrawal')} disabled={start.isPending}>
          <ArrowUpFromLine className="mr-1.5 h-4 w-4" />
          Withdraw
        </Button>
      </div>

      {polling.needsAuth && active.length > 0 && (
        <button
          type="button"
          onClick={() => polling.authenticate().catch((err) => notify.error(err))}
          className="mt-3 text-xs text-gray-500 underline hover:text-color4"
        >
          Session expired — sign to refresh statuses
        </button>
      )}

      {active.length > 0 && (
        <div className="mt-4 space-y-2">
          {active.map((record) => (
            <div key={record.id} className="rounded-xl bg-color1 px-4 py-3 ring-1 ring-inset ring-black/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-color4">
                    {record.direction === 'deposit' ? 'Cash deposit' : 'Cash withdrawal'}
                    {record.amountIn && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        {record.amountIn} {record.assetCode}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{statusLabel(record)}</p>
                  {record.externalRef && (
                    <p className="mt-1 text-xs text-gray-600">
                      Reference code: <span className="font-mono font-semibold">{record.externalRef}</span>
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {record.direction === 'withdrawal' && record.status === 'pending_user_transfer_start' && (
                    <Button size="sm" onClick={() => handleSend(record)} disabled={send.isPending}>
                      {send.isPending ? 'Sending…' : 'Send USDC'}
                    </Button>
                  )}
                  {record.moreInfoUrl && (
                    <a
                      className="text-xs text-gray-400 underline hover:text-color4"
                      href={record.moreInfoUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Details
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">History</p>
          <ul className="mt-2 divide-y divide-gray-100">
            {history.map((record) => (
              <li key={record.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-600">
                  {record.direction === 'deposit' ? 'Deposit' : 'Withdrawal'}
                  <span className="ml-2 text-xs text-gray-400">
                    {statusLabel(record)} · {new Date(record.startedAt).toLocaleDateString()}
                  </span>
                </span>
                <span className="font-semibold tabular-nums text-color4">
                  {record.amountOut ?? record.amountIn ?? '—'} {record.assetCode}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StellarRampPanel;
