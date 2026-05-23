// scripts/snapshot.ts
import { createPublicClient, http, formatUnits, parseUnits, parseAbiItem, type AbiEvent, type Address } from 'viem';
import { base } from 'viem/chains';
import fs from 'node:fs';
import path from 'node:path';

type BalanceRow = { address: Address; balance: bigint };

type FrontRowBase = {
  address: Address;
  balance_raw: string;
  balance: string;
  percent: string;
};

type FrontRowWithUsdc = FrontRowBase & { usdc_raw: string; usdc: string };
type FrontRow = FrontRowBase | FrontRowWithUsdc;

type TransferLog = { args: { from: Address; to: Address; value: bigint } };

const RPC = 'https://base.publicnode.com';
const TFT_001: Address = '0xB48F4d5E455a6d67f26FE364a201F51FF71aaB26';
const FROM_BLOCK: bigint = 33201495n;
const SNAPSHOT_BLOCK: bigint | null = null; // null => latest

const MARKETPLACE_OLD: Address = '0x93A696619723a0269BDC2F1532cc1ec7D3a5c854';
const MARKETPLACE_NEW: Address = '0xe0F632423a6bf824d7E4463470549b73048C3f4e';
const EXCLUDE = new Set<Address>([MARKETPLACE_OLD, MARKETPLACE_NEW]);

const PERCENT_DECIMALS = 4;
const OUTPUT_JSON_PATH = path.join(process.cwd(), 'public/snapshots/holders_snapshot.json');
const FIXED_TOTAL_SUPPLY_TOKENS = '1000';

const ERC20_ABI = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
] as const;

const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
const ZERO_ADDR: Address = '0x0000000000000000000000000000000000000000';

const publicClient = createPublicClient({ chain: base, transport: http(RPC) });

/** --- Utils: simple promise pool for concurrency control --- */
async function mapPool<T, R>(items: T[], limit: number, worker: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const ret: R[] = new Array(items.length);
  let i = 0;
  const runners: Promise<void>[] = [];
  const run = async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      ret[idx] = await worker(items[idx], idx);
    }
  };
  for (let k = 0; k < Math.min(limit, items.length); k++) runners.push(run());
  await Promise.all(runners);
  return ret;
}

/** --- Atomic block --- */
async function getSnapshotBlock(): Promise<bigint> {
  return SNAPSHOT_BLOCK ?? (await publicClient.getBlockNumber());
}

/** --- Robust, concurrent getLogs with adaptive step + retries --- */
type Range = { fromBlock: bigint; toBlock: bigint };
function makeRanges(fromBlock: bigint, toBlock: bigint, step: bigint): Range[] {
  const out: Range[] = [];
  for (let start = fromBlock; start <= toBlock; start += step) {
    const end = start + step - 1n <= toBlock ? start + step - 1n : toBlock;
    out.push({ fromBlock: start, toBlock: end });
  }
  return out;
}

async function getLogsRangeWithRetry(
  address: Address,
  range: Range,
  event: AbiEvent,
  maxRetries = 4
): Promise<TransferLog[]> {
  const from = range.fromBlock;
  const to = range.toBlock;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const logs = (await publicClient.getLogs({ address, event, fromBlock: from, toBlock: to })) as unknown as TransferLog[];
      return logs;
    } catch (e) {
      // If provider chokes on the slice, split it in half and try both halves
      if (to - from <= 1n) throw e;
      const mid = from + (to - from) / 2n;
      const [left, right] = await Promise.all([
        getLogsRangeWithRetry(address, { fromBlock: from, toBlock: mid }, event, maxRetries - 1),
        getLogsRangeWithRetry(address, { fromBlock: mid + 1n, toBlock: to }, event, maxRetries - 1),
      ]);
      return [...left, ...right];
    }
  }
  // Shouldn't reach here due to the recursive split above
  return [];
}

async function getAllTransferLogsFast(address: Address, fromBlock: bigint, toBlock: bigint): Promise<TransferLog[]> {
  // Start with a large step; provider limits will be handled by the retry splitter.
  const INITIAL_STEP = 200_000n;
  const ranges = makeRanges(fromBlock, toBlock, INITIAL_STEP);
  // Parallelize moderately to avoid throttling (tune 6–10 depending on your RPC)
  const CONCURRENCY = 8;
  const parts = await mapPool(ranges, CONCURRENCY, (r) => getLogsRangeWithRetry(address, r, TRANSFER_EVENT));
  // flatten
  return parts.flat();
}

/** --- Address extraction (dedup + excludes) --- */
function uniqAddressesFromTransfers(logs: TransferLog[], exclude: Set<Address>): Address[] {
  const set = new Set<string>();
  for (const l of logs) {
    const from = (l.args?.from ?? ZERO_ADDR).toLowerCase();
    const to = (l.args?.to ?? ZERO_ADDR).toLowerCase();
    if (from !== ZERO_ADDR) set.add(from);
    if (to !== ZERO_ADDR) set.add(to);
  }
  for (const ex of exclude) set.delete(ex.toLowerCase());
  // back to Address type
  return Array.from(set) as Address[];
}

/** --- Multicall balances in fast batches (parallel) --- */
async function readBalancesMulticall(addresses: Address[], blockNumber: bigint): Promise<BalanceRow[]> {
  const BATCH_SIZE = 250;     // safe for most RPCs
  const CONCURRENCY = 6;      // number of parallel multicalls
  const batches: Address[][] = [];
  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    batches.push(addresses.slice(i, i + BATCH_SIZE));
  }

  const results = await mapPool(batches, CONCURRENCY, async (batch) => {
    const contracts = batch.map((a) => ({
      address: TFT_001,
      abi: ERC20_ABI,
      functionName: 'balanceOf' as const,
      args: [a] as const,
    }));
    const res = await publicClient.multicall({ contracts, blockNumber, allowFailure: true });
    const rows: BalanceRow[] = [];
    for (let i = 0; i < batch.length; i++) {
      const out = res[i];
      if (out.status === 'success') {
        const bal = out.result as unknown as bigint;
        if (bal > 0n) rows.push({ address: batch[i], balance: bal });
      }
      // if 'failure', we just skip (balance assumed 0 or view failed); extremely rare for ERC20.balanceOf
    }
    return rows;
  });

  return results.flat();
}

/** --- Compute rows for front --- */
function computeFrontReady(
  balances: BalanceRow[],
  tokenDecimals: number,
  totalUsdc6: bigint | null,
  percentDecimals: number,
  totalSupplyRaw: bigint,
): FrontRow[] {
  const sorted = [...balances].sort((a, b) => (b.balance > a.balance ? 1 : -1));

  if (totalUsdc6 === null) {
    const rows: FrontRowBase[] = sorted.map(({ address, balance }) => ({
      address,
      balance_raw: balance.toString(),
      balance: formatUnits(balance, tokenDecimals),
      percent: ((Number(balance) / Number(totalSupplyRaw)) * 100).toFixed(percentDecimals),
    }));
    return rows;
  }

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

/** --- Public API --- */
export async function generateSnapshot(opts?: { totalUsdc?: string | null }): Promise<FrontRow[]> {
  // 1) Pin atomic block
  const blockNumber = await getSnapshotBlock();

  // 2) Read decimals once (cheap)
  const tokenDecimals = (await publicClient.readContract({
    address: TFT_001,
    abi: ERC20_ABI,
    functionName: 'decimals',
    blockNumber,
  })) as number;

  // 3) Fast & robust transfer scan (FROM_BLOCK..blockNumber)
  const logs: TransferLog[] = await getAllTransferLogsFast(TFT_001, FROM_BLOCK, blockNumber);

  // 4) Unique addresses (minus excludes)
  const addresses: Address[] = uniqAddressesFromTransfers(logs, EXCLUDE);
  if (addresses.length === 0) return [];

  // 5) Multicall balances at the SAME block (atomic)
  const balances: BalanceRow[] = await readBalancesMulticall(addresses, blockNumber);

  // 6) Compute totals and rows
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

  // 7) Persist to disk
  const dir = path.dirname(OUTPUT_JSON_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(frontRows, null, 2), 'utf-8');

  return frontRows;
}

export type { FrontRow, FrontRowBase, FrontRowWithUsdc };
