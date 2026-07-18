import React from 'react';
import { ExternalLink } from 'lucide-react';
import ChainIcon from '@/components/shared/ChainIcon';

interface ContractsProps {
  polygonContract?: string;
  baseContract?: string;
  ethereumContract?: string;
}

const Contracts = ({ polygonContract, baseContract, ethereumContract }: ContractsProps) => {
  const links: { chain: string; label: string; href: string }[] = [];
  if (polygonContract)
    links.push({ chain: 'Polygon', label: 'Polygon', href: `https://polygonscan.com/address/${polygonContract}` });
  if (baseContract) links.push({ chain: 'Base', label: 'Base', href: `https://basescan.org/address/${baseContract}` });
  if (ethereumContract)
    links.push({ chain: 'Ethereum', label: 'Ethereum', href: `https://etherscan.io/address/${ethereumContract}` });

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(({ chain, label, href }) => (
        <a
          key={chain}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-color4 ring-1 ring-black/5 transition-colors hover:bg-color2 hover:text-white"
        >
          <span className="flex h-4 w-4 items-center justify-center">
            <ChainIcon chain={chain} size={16} />
          </span>
          {label}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ))}
    </div>
  );
};

export default Contracts;
