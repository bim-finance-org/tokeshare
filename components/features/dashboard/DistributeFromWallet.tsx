'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { parseAbi, type Address } from 'viem';
import { CONTRACTS } from '@/contracts/contracts';
import { base } from 'viem/chains';
import ConnectWalletButton from '@/components/shared/ConnectButton';

type FrontRowBase = { address: Address; balance_raw: string; balance: string; percent: string };
type FrontRowWithUsdc = FrontRowBase & { usdc_raw: string; usdc: string };
type FrontRow = FrontRowBase | FrontRowWithUsdc;

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
]);

const DISTRIBUTOR_ABI = parseAbi([
  'function distribute(address token, address[] recipients, uint256[] amounts) external',
  'event Distributed(address indexed token, uint256 count, uint256 totalAmount)',
]);

const MAX_RECIPIENTS_PER_TX = 200;

const CHAIN = base;

const BATCH_DISTRIBUTOR_ADDRESS: Address = CONTRACTS.BATCH_DISTRIBUTOR as Address;

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function DistributeFromWallet() {
  const { address, chainId, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleDistribute() {
    try {
      setBusy(true);
      setMsg(null);

      if (!isConnected || !walletClient || !publicClient) {
        throw new Error('Wallet non connecté.');
      }
      if (chainId !== CHAIN.id) {
        throw new Error(`Change de réseau : ${CHAIN.name}.`);
      }

      const res = await fetch('/api/snapshot', { cache: 'no-store' });
      if (!res.ok) throw new Error('No Snapshot');
      const payload = (await res.json()) as { rows: FrontRow[] };
      const rows = payload.rows;
      const withUsdc = rows.filter((r): r is FrontRowWithUsdc => 'usdc_raw' in r && BigInt(r.usdc_raw) > 0n);
      if (withUsdc.length === 0) throw new Error('Aucune ligne à distribuer (usdc_raw = 0).');

      const recipients = withUsdc.map((r) => r.address);
      const amounts = withUsdc.map((r) => BigInt(r.usdc_raw));
      const total = amounts.reduce((s, x) => s + x, 0n);

      const balance = (await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address as Address],
      })) as bigint;

      if (balance < total) {
        throw new Error(`Solde USDC insuffisant. Requis (6 décimales) : ${total.toString()}`);
      }

      const allowance = (await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address as Address, BATCH_DISTRIBUTOR_ADDRESS],
      })) as bigint;

      if (allowance < total) {
        if (allowance > 0n) {
          const tx0 = await walletClient.writeContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [BATCH_DISTRIBUTOR_ADDRESS, 0n],
          });
          await publicClient.waitForTransactionReceipt({ hash: tx0 });
        }
        const tx1 = await walletClient.writeContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [BATCH_DISTRIBUTOR_ADDRESS, total],
        });
        await publicClient.waitForTransactionReceipt({ hash: tx1 });
      }

      const recChunks = chunk(recipients, MAX_RECIPIENTS_PER_TX);
      const amtChunks = chunk(amounts, MAX_RECIPIENTS_PER_TX);

      const txHashes: `0x${string}`[] = [];
      for (let i = 0; i < recChunks.length; i++) {
        const hash = await walletClient.writeContract({
          address: BATCH_DISTRIBUTOR_ADDRESS,
          abi: DISTRIBUTOR_ABI,
          functionName: 'distribute',
          args: [USDC_ADDRESS, recChunks[i], amtChunks[i]],
          chain: CHAIN,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        txHashes.push(hash);
      }

      setMsg(`✅ Distribution OK — ${recipients.length} destinataires, ${txHashes.length} tx.`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur distribution';
      setMsg(`❌ ${message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleDistribute} disabled={!isConnected || busy}>
        {busy ? 'Distribution…' : 'Distribuer depuis mon wallet'}
      </Button>
      {msg && <p className="text-sm text-color4">{msg}</p>}
      {!isConnected && <ConnectWalletButton />}
    </div>
  );
}
