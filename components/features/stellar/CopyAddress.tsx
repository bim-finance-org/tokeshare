'use client';

// Shows a shortened Stellar address with a one-click copy button (the full G...
// address is copied to the clipboard). Used wherever a connected address is
// displayed so users can fund the wallet.

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CopyAddress({ address, className }: { address: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const short = `${address.slice(0, 6)}...${address.slice(-6)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — ignore.
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 ${className ?? ''}`}>
      <span className="font-mono text-sm text-color4">{short}</span>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy address"
        title={copied ? 'Copied!' : 'Copy address'}
        className="text-color6 transition-colors hover:text-color4"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </span>
  );
}
