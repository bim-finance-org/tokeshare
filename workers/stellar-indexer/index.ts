// Stellar indexer worker — long-running process, deployed on Coolify as its
// own app (no public domain), sharing the main Postgres.
//
//   npm run indexer
//
// Polls every STELLAR_INDEXER_POLL_MINUTES (default 30) — the real constraint
// is the RPC's ~24h event retention: a worker down longer than that loses
// events permanently, and a missed transfer means an address the payout
// snapshot cannot see. The /health endpoint reports per-network lag so Coolify
// restarts a stuck worker long before that cliff.
//
// It also follows SDP distribution rounds: every SDP_SYNC_SECONDS (default
// 60) it pulls the payment states of rounds still in flight from the SDP
// (lib/stellar-rounds.ts → syncActiveRounds). An SDP outage is reported on
// /health but never fails it — restarting the indexer would not help.

import { createServer } from 'node:http';
import { prisma } from '@/lib/prisma';
import { syncActiveRounds } from '@/lib/stellar-rounds';
import { buildWatched, pollNetwork, type PollStats } from './ingest';
import { errorMessage } from '@/lib/error-message';

const POLL_MS = (Number(process.env.STELLAR_INDEXER_POLL_MINUTES) || 30) * 60_000;
const PORT = Number(process.env.PORT) || 8080;
/** Lag above which /health flips to 503 (Coolify restarts the app). */
const MAX_LAG_MS = (Number(process.env.STELLAR_INDEXER_MAX_LAG_MINUTES) || 120) * 60_000;
const SDP_SYNC_MS = (Number(process.env.SDP_SYNC_SECONDS) || 60) * 1000;

interface NetworkHealth extends PollStats {
  at: string;
  error?: string;
}

const state = {
  startedAt: new Date().toISOString(),
  lastPollAt: null as string | null,
  networks: {} as Record<string, NetworkHealth>,
  sdpSync: null as { at: string; synced: number; errors: string[] } | null,
};

async function pollAll(): Promise<void> {
  const watched = buildWatched();
  for (const network of watched) {
    const name = network.profile.network;
    try {
      const stats = await pollNetwork(network);
      state.networks[name] = { ...stats, at: new Date().toISOString() };
      const gap = stats.gapLedgers > 0 ? ` ⚠️ gap=${stats.gapLedgers}` : '';
      console.log(
        `[indexer][${name}] ledger ${stats.lastLedger}/${stats.latestLedger} ` +
          `fetched=${stats.fetched} processed=${stats.processed}${gap}`,
      );
    } catch (error) {
      const message = errorMessage(error);
      state.networks[name] = {
        ...(state.networks[name] ?? {
          network: name,
          fetched: 0,
          processed: 0,
          lastLedger: 0,
          latestLedger: 0,
          gapLedgers: 0,
        }),
        at: new Date().toISOString(),
        error: message,
      };
      console.error(`[indexer][${name}] poll failed:`, message);
    }
  }
  state.lastPollAt = new Date().toISOString();
}

async function syncRounds(): Promise<void> {
  try {
    const { synced, errors } = await syncActiveRounds();
    state.sdpSync = { at: new Date().toISOString(), synced, errors };
    for (const error of errors) console.error('[indexer][rounds] sync failed:', error);
  } catch (error) {
    const message = errorMessage(error);
    state.sdpSync = { at: new Date().toISOString(), synced: 0, errors: [message] };
    console.error('[indexer][rounds] sync failed:', message);
  }
}

/** Healthy = every network polled successfully within the lag budget. */
function healthy(): boolean {
  if (!state.lastPollAt) return Date.now() - Date.parse(state.startedAt) < MAX_LAG_MS; // still starting
  const entries = Object.values(state.networks);
  if (entries.length === 0) return false;
  return entries.every((n) => !n.error && Date.now() - Date.parse(n.at) < MAX_LAG_MS);
}

const server = createServer((req, res) => {
  if (req.url === '/health') {
    const ok = healthy();
    res.writeHead(ok ? 200 : 503, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok, ...state }, null, 2));
    return;
  }
  res.writeHead(404).end();
});

async function main(): Promise<void> {
  server.listen(PORT, () => console.log(`[indexer] health on :${PORT}/health, polling every ${POLL_MS / 60_000}min`));

  let stopped = false;
  const stop = async () => {
    if (stopped) return;
    stopped = true;
    console.log('[indexer] shutting down');
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);

  // Two independent cadences: chain events (slow, retention-bound) and SDP
  // payment states (fast, so the console follows a disbursement live).
  void (async () => {
    for (;;) {
      await syncRounds();
      await new Promise((resolve) => setTimeout(resolve, SDP_SYNC_MS));
    }
  })();

  for (;;) {
    await pollAll();
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}

main().catch((error) => {
  console.error('[indexer] fatal:', error);
  process.exit(1);
});
