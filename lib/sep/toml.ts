// SEP-1: fetch and parse an anchor's stellar.toml. Only the handful of fields
// the ramp flows need are extracted (auth endpoint, SEP-24 transfer server,
// signing key, currencies), so a full TOML parser dependency is avoided — all
// anchors publish these as simple quoted top-level values.

export interface AnchorCurrency {
  code: string;
  issuer: string;
}

export interface AnchorToml {
  homeDomain: string;
  webAuthEndpoint: string;
  transferServerSep24: string;
  signingKey: string;
  currencies: AnchorCurrency[];
}

const topLevelValue = (source: string, key: string): string | undefined =>
  source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"`, 'm'))?.[1];

function parseCurrencies(source: string): AnchorCurrency[] {
  const currencies: AnchorCurrency[] = [];
  const blocks = source.split('[[CURRENCIES]]').slice(1);
  for (const block of blocks) {
    // A block ends at the next section header ("[..." at start of line).
    const body = block.split(/\n\[/)[0]!;
    const code = topLevelValue(body, 'code');
    const issuer = topLevelValue(body, 'issuer');
    if (code && issuer) currencies.push({ code, issuer });
  }
  return currencies;
}

export async function fetchAnchorToml(homeDomain: string): Promise<AnchorToml> {
  const res = await fetch(`https://${homeDomain}/.well-known/stellar.toml`);
  if (!res.ok) throw new Error(`Could not load the anchor's stellar.toml (${res.status})`);
  const text = await res.text();

  const webAuthEndpoint = topLevelValue(text, 'WEB_AUTH_ENDPOINT');
  const transferServerSep24 = topLevelValue(text, 'TRANSFER_SERVER_SEP0024');
  const signingKey = topLevelValue(text, 'SIGNING_KEY');
  if (!webAuthEndpoint || !signingKey) throw new Error('The anchor does not advertise SEP-10 authentication');
  if (!transferServerSep24) throw new Error('The anchor does not advertise SEP-24 transfers');

  return {
    homeDomain,
    webAuthEndpoint: webAuthEndpoint.replace(/\/$/, ''),
    transferServerSep24: transferServerSep24.replace(/\/$/, ''),
    signingKey,
    currencies: parseCurrencies(text),
  };
}

/** The anchor-side issuer for an asset code (deposits arrive as THIS asset). */
export const anchorAssetIssuer = (toml: AnchorToml, code: string): string | undefined =>
  toml.currencies.find((c) => c.code === code)?.issuer;
