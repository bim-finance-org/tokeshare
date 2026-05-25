export interface Partner {
  name: string;
  /** Short category label shown as a badge on the card. */
  category: string;
  description: string;
  url: string;
  /** Path to the logo under /public. */
  logo: string;
}

export const partners: Partner[] = [
  {
    name: 'KyberSwap',
    category: 'DEX Aggregator',
    description:
      'Kyber Network is building a world where any token is usable anywhere. KyberSwap.com, our flagship Decentralized Exchange (DEX) aggregator and liquidity platform, provides the best rates for traders in DeFi and maximizes returns for liquidity providers.',
    url: 'https://kyber.network/',
    logo: '/images/partners/kyberswap.png',
  },
  {
    name: 'Bungee Protocol',
    category: 'Cross-chain Bridge',
    description: 'Swap tokens across chains.',
    url: 'https://www.bungee.exchange/',
    logo: '/images/partners/bungee.png',
  },
  {
    name: 'Stellar Wallet Integration',
    category: 'Wallet Toolkit',
    description: 'Stellar Wallets Kit — all Stellar wallets with just one library.',
    url: 'https://stellarwalletskit.dev/',
    logo: '/images/partners/stellar.png',
  },
  {
    name: 'Polygon',
    category: 'Blockchain',
    description:
      'The Polygon Chain is fast, low cost, and battle-tested. Live for five years, with 99.99% uptime and millions of users, this is the best place to build onchain.',
    url: 'https://polygon.technology/',
    logo: '/images/blockchains/polygon.png',
  },
  {
    name: 'Ethereum',
    category: 'Blockchain',
    description:
      'Ethereum is a global, decentralized platform for money and new kinds of applications. On Ethereum, you control your own money, data, and identity.',
    url: 'https://ethereum.org/',
    logo: '/images/blockchains/ethereum.png',
  },
  {
    name: 'Base',
    category: 'Blockchain',
    description:
      'The blockchain for global finance. Built by Coinbase, trusted by leading institutions, and open to all.',
    url: 'https://www.base.org/',
    logo: '/images/blockchains/base.png',
  },
  {
    name: 'WalletConnect',
    category: 'Wallet Connectivity',
    description:
      'With one integration, access 80K+ apps with 99% less technical overhead. Trusted by custodians, self-custody, mobile, and hardware wallets.',
    url: 'https://walletconnect.network/',
    logo: '/images/partners/walletconnect.png',
  },
  {
    name: 'Stellar Network',
    category: 'Blockchain',
    description:
      'Stellar Network: an open-source blockchain for enterprises and institutions, offering secure smart contracts, fast payments, and asset tokenization.',
    url: 'https://stellar.org/',
    logo: '/images/partners/stellar.png',
  },
];
