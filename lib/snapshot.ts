// scripts/snapshot.ts
import { createPublicClient, http, formatUnits, parseUnits, parseAbiItem, Address } from 'viem';
import { base } from 'viem/chains';
import fs from 'node:fs';
import path from 'node:path';

type BalanceRow = {
  address: Address;
  balance: bigint;
};

type FrontRowBase = {
  address: Address;
  balance_raw: string;
  balance: string;
  percent: string;
};

type FrontRowWithUsdc = FrontRowBase & {
  usdc_raw: string;
  usdc: string;
};

type FrontRow = FrontRowBase | FrontRowWithUsdc;

type TransferLog = {
  args: { from: Address; to: Address; value: bigint };
};

const RPC = 'https://base.publicnode.com';
const TFT_001: Address = '0xB48F4d5E455a6d67f26FE364a201F51FF71aaB26';
const FROM_BLOCK: bigint = BigInt(33201495);
const SNAPSHOT_BLOCK: bigint | null = null; // null => latest

const MARKETPLACE: Address = '0x93A696619723a0269BDC2F1532cc1ec7D3a5c854';
const EXCLUDE = new Set<Address>([MARKETPLACE]);

const SHOW_TOP = 50;
const PERCENT_DECIMALS = 4;
const OUTPUT_JSON_PATH = path.join(process.cwd(), 'public/snapshots/holders_snapshot.json');

const FIXED_TOTAL_SUPPLY_TOKENS = '1000';

const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
] as const;

const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

const publicClient = createPublicClient({ chain: base, transport: http(RPC) });

async function getLatestBlock(): Promise<bigint> {
  return publicClient.getBlockNumber();
}

type GetLogsChunkedArgs = {
  address: Address;
  fromBlock: bigint;
  toBlock: bigint;
  step?: bigint;
};

async function getLogsChunked({
  address,
  fromBlock,
  toBlock,
  step = 50_000n,
}: GetLogsChunkedArgs): Promise<TransferLog[]> {
  const out: TransferLog[] = [];
  let start = fromBlock;

  while (start <= toBlock) {
    const end = start + step - 1n <= toBlock ? start + step - 1n : toBlock;
    const logs = (await publicClient.getLogs({
      address,
      event: TRANSFER_EVENT,
      fromBlock: start,
      toBlock: end,
    })) as unknown as TransferLog[];

    out.push(...logs);
    start = end + 1n;
  }
  return out;
}

function uniqAddressesFromTransfers(logs: TransferLog[], exclude: Set<Address>): Address[] {
  const set = new Set<Address>();
  const ZERO_ADDR: Address = '0x0000000000000000000000000000000000000000';

  for (const l of logs) {
    const from = (l.args?.from ?? ZERO_ADDR).toLowerCase() as Address;
    const to = (l.args?.to ?? ZERO_ADDR).toLowerCase() as Address;
    if (from !== ZERO_ADDR) set.add(from);
    if (to !== ZERO_ADDR) set.add(to);
  }
  for (const ex of exclude) set.delete(ex.toLowerCase() as Address);
  return [...set];
}

async function readBalancesAt(addresses: Address[], blockNumber: bigint | null): Promise<BalanceRow[]> {
  const rows: BalanceRow[] = [];
  for (const a of addresses) {
    const bal = (await publicClient.readContract({
      address: TFT_001,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [a],
      ...(blockNumber ? { blockNumber } : {}),
    })) as bigint;

    if (bal > 0n) rows.push({ address: a, balance: bal });
  }
  return rows;
}

function percentFromPpm(ppm: bigint, decimals: number = 2): string {
  // 1_000_000 ppm = 100.00%
  const percentTimes100 = Number(ppm) / 10000;
  return percentTimes100.toFixed(decimals);
}

function computeFrontReady(
  balances: BalanceRow[],
  tokenDecimals: number,
  totalUsdc6: bigint | null,
  percentDecimals: number,
  totalSupplyRaw: bigint,
): FrontRow[] {
  const sorted = [...balances].sort((a, b) => (b.balance > a.balance ? 1 : -1));

  if (totalUsdc6 === null) {
    // Pourcentage = balance / totalSupply
    const rows: FrontRowBase[] = sorted.map(({ address, balance }) => ({
      address,
      balance_raw: balance.toString(),
      balance: formatUnits(balance, tokenDecimals),
      percent: ((Number(balance) / Number(totalSupplyRaw)) * 100).toFixed(percentDecimals),
    }));
    return rows;
  }

  // Avec USDC : payout = totalUsdc * (balance / totalSupply)
  const rowsWithUsdc: FrontRowWithUsdc[] = sorted.map(({ address, balance }) => {
    const usdc_6 = (totalUsdc6 * balance) / totalSupplyRaw;
    return {
      address,
      balance_raw: balance.toString(),
      balance: formatUnits(balance, tokenDecimals),
      percent: ((Number(balance) / Number(totalSupplyRaw)) * 100).toFixed(percentDecimals),
      usdc_raw: usdc_6.toString(),
      usdc: formatUnits(usdc_6, 6),
    };
  });

  return rowsWithUsdc;
}

export async function generateSnapshot(opts?: { totalUsdc?: string | null }): Promise<FrontRow[]> {
  const blockNumber: bigint = SNAPSHOT_BLOCK ?? (await getLatestBlock());

  const tokenDecimals = (await publicClient.readContract({
    address: TFT_001,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })) as number;

  const logs: TransferLog[] = await getLogsChunked({
    address: TFT_001,
    fromBlock: FROM_BLOCK,
    toBlock: blockNumber,
    step: 50_000n,
  });

  const addresses: Address[] = uniqAddressesFromTransfers(logs, EXCLUDE);
  const balances: BalanceRow[] = await readBalancesAt(addresses, SNAPSHOT_BLOCK ? blockNumber : null);

  const totalSupplyRaw = parseUnits(FIXED_TOTAL_SUPPLY_TOKENS, tokenDecimals);

  const totalUsdc6: bigint | null =
    opts?.totalUsdc && opts.totalUsdc.trim() !== '' ? parseUnits(opts.totalUsdc, 6) : null;

  const frontRows: FrontRow[] = computeFrontReady(
    balances,
    tokenDecimals,
    totalUsdc6,
    PERCENT_DECIMALS,
    totalSupplyRaw,
  );
  return frontRows;
}

export type { FrontRow, FrontRowBase, FrontRowWithUsdc };
