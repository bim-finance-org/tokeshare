// SEP-1 stellar.toml for THIS app acting as a wallet (client domain). Served
// at /.well-known/stellar.toml via a next.config rewrite. Anchors that require
// client_domain authentication (MoneyGram) fetch SIGNING_KEY here to verify
// our co-signature on SEP-10 challenges. The public key is derived from the
// server-held secret, so there is exactly one env var to rotate.

import { Keypair } from '@stellar/stellar-sdk';

export async function GET() {
  const secret = process.env.STELLAR_RAMP_AUTH_SECRET;
  if (!secret) return new Response('Not configured', { status: 404 });

  let signingKey: string;
  try {
    signingKey = Keypair.fromSecret(secret).publicKey();
  } catch {
    return new Response('Not configured', { status: 404 });
  }

  const body = ['VERSION = "2.0.0"', '', `SIGNING_KEY = "${signingKey}"`, ''].join('\n');
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*', // SEP-1 requires CORS for anchor fetches
      'Cache-Control': 'public, max-age=300',
    },
  });
}
