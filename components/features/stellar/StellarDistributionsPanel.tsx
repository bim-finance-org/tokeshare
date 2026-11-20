'use client';

// Investor revenue panel (user dashboard): pending claims + payout history.
//
// The nominal case shows nothing to do — distributions arrive on their own
// (SDP payment or operator push). Claim buttons only appear for lines the push
// had to skip (no USDC trustline at distribution time, or a failed payment
// the operator moved to the claim path).

import React from 'react';
import { HandCoins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStellarAsset } from '@/config/stellar-assets';
import { useStellarAccount } from '@/context/StellarContext';
import {
  type DistributionLine,
  useClaimDistribution,
  usePortfolioDistributions,
} from '@/hooks/useStellarDistributions';
import { explorerTxUrl, stroopsToUnits } from '@/lib/stellar';
import { notify } from '@/lib/notify';

const symbolOf = (slug: string) => getStellarAsset(slug)?.symbol ?? slug;

const lineKey = (line: DistributionLine) =>
  `${line.network}-${line.channel}-${line.roundId ?? ''}-${line.cycleId ?? ''}`;

/** Distributor lines are labelled by cycle; SDP lines by payout date. */
const lineLabel = (line: DistributionLine) =>
  line.cycleId !== null
    ? `cycle #${line.cycleId}`
    : line.paidAt
      ? new Date(line.paidAt).toLocaleDateString()
      : 'payout';

const StellarDistributionsPanel = () => {
  const { isConnected } = useStellarAccount();
  const { data: lines } = usePortfolioDistributions();
  const claim = useClaimDistribution();

  if (!isConnected || !lines || lines.length === 0) return null;

  const claimables = lines.filter((l) => l.status === 'claimable' && !l.expired && l.cycleId !== null);
  const inProgress = lines.filter((l) => l.status === 'pending' || l.status === 'failed');
  const history = lines.filter((l) => l.status === 'paid');

  const handleClaim = async (line: DistributionLine) => {
    if (line.cycleId === null) return;
    try {
      const hash = await claim.mutateAsync({ network: line.network, cycleId: line.cycleId });
      notify.success(`Distribution claimed — tx ${hash.slice(0, 8)}…`);
    } catch (err) {
      notify.error(err);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-color1 text-color4">
          <HandCoins className="h-4 w-4" />
        </span>
        <h2 className="font-titleSemibold text-lg text-color4">Revenue distributions</h2>
      </div>

      {claimables.length > 0 && (
        <div className="mt-4 space-y-2">
          {claimables.map((line) => (
            <div
              key={lineKey(line)}
              className="flex items-center justify-between rounded-xl bg-color1 px-4 py-3 ring-1 ring-inset ring-black/5"
            >
              <div>
                <p className="font-semibold text-color4">
                  {stroopsToUnits(BigInt(line.amount))} USDC
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    {symbolOf(line.assetSlug)} · {lineLabel(line)}
                  </span>
                </p>
                {line.expiresAt && (
                  <p className="text-xs text-gray-500">Claim before {new Date(line.expiresAt).toLocaleDateString()}</p>
                )}
              </div>
              <Button size="sm" onClick={() => handleClaim(line)} disabled={claim.isPending}>
                {claim.isPending ? 'Claiming…' : 'Claim'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {inProgress.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">In progress</p>
          <ul className="mt-2 divide-y divide-gray-100">
            {inProgress.map((line) => (
              <li key={lineKey(line)} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-600">
                  {symbolOf(line.assetSlug)}
                  <span className="ml-2 text-xs text-gray-400">
                    {line.status === 'failed' ? 'payment failed — being moved to a claim' : 'payment on its way'}
                  </span>
                </span>
                <span className="font-semibold tabular-nums text-gray-400">
                  {stroopsToUnits(BigInt(line.amount))} USDC
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">History</p>
          <ul className="mt-2 divide-y divide-gray-100">
            {history.map((line) => (
              <li key={lineKey(line)} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-600">
                  {symbolOf(line.assetSlug)} · {lineLabel(line)}
                  <span className="ml-2 text-xs text-gray-400">
                    {line.pushed ? 'received' : 'claimed'}
                    {line.paidAt ? ` · ${new Date(line.paidAt).toLocaleDateString()}` : ''}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-semibold tabular-nums text-color4">
                    +{stroopsToUnits(BigInt(line.amount))} USDC
                  </span>
                  {line.paidTx && (
                    <a
                      className="text-xs text-gray-400 underline hover:text-color4"
                      href={explorerTxUrl(line.network, line.paidTx)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      tx
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StellarDistributionsPanel;
