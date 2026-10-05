// Alfred operator commands, run against whatever ALFRED_* .env.local points at.
//
//   npm run alfred -- check [COUNTRY]        keys work? corridor routes LIVE?
//   npm run alfred -- register-webhook <url> subscribe our receiver to events
//
// `check` is the first thing to run once API keys exist: it is read-only and
// tells in one call whether authentication works and which payout routes the
// country exposes (only LIVE ones accept production traffic; SANDBOX means
// sandbox-only).

import { ALFRED_CORRIDORS } from '@/config/alfred';
import { AlfredError, createWebhookEndpoint, getCountry, isAlfredSandbox } from '@/lib/alfred/client';

/** What the receiver acts on; Alfred adds types without notice and they are ignored. */
const EVENT_TYPES = ['customer.*', 'linked_account.*', 'deposit.*', 'payout.*'];

async function check(country: string): Promise<void> {
  console.log(`Alfred ${isAlfredSandbox() ? 'sandbox' : 'production'} — reading ${country} routes`);
  const detail = await getCountry(country);
  const corridors = ALFRED_CORRIDORS.filter((c) => c.country === detail.code);
  for (const route of detail.routes ?? []) {
    const ours = corridors.some((c) => c.currency === route.currency && c.rail === route.rail);
    console.log(
      `${ours ? '→' : ' '} ${route.currency.padEnd(4)} ${route.destinationType.padEnd(13)} ${route.rail.padEnd(7)} ${route.status.padEnd(8)} ${(route.operations ?? []).join(',')}`,
    );
  }
  console.log('Authentication OK. Lines marked → are corridors this app uses.');
}

async function registerWebhook(url: string): Promise<void> {
  const endpoint = await createWebhookEndpoint(url, EVENT_TYPES);
  console.log(`Registered ${endpoint.id} → ${endpoint.url} (${endpoint.event_types.join(', ')})`);
  // The receiver authenticates by fetching each event back, so the secret is not
  // required today — but Alfred shows it only once, so keep it in the vault.
  if (endpoint.secret) console.log(`Signing secret (shown once — keep it in the password manager): ${endpoint.secret}`);
}

async function main(): Promise<void> {
  const [command, arg] = process.argv.slice(2);
  if (command === 'check') return check(arg ?? 'MEX');
  if (command === 'register-webhook' && arg) return registerWebhook(arg);
  console.error('usage: npm run alfred -- check [COUNTRY] | register-webhook <url>');
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof AlfredError ? `Alfred ${error.status} ${error.code ?? ''}: ${error.message}` : error);
  process.exit(1);
});
