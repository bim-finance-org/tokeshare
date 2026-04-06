import { createWalletClient, http, parseUnits, Address, decodeEventLog } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { PUBLIC_CLIENTS } from '@/lib/clients';
import { Blockchain } from '@/enums/Blockchain';
import { CONTRACTS } from '@/contracts/contracts';

const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;
const USDC_DECIMALS = 6;

const ERC20_TRANSFER_ABI = [
  {
    type: 'function' as const,
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable' as const,
  },
] as const;

const TRANSFER_EVENT_ABI = [
  {
    type: 'event' as const,
    name: 'Transfer',
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
  },
] as const;

export async function sendUSDC(recipientAddress: Address, usdcAmount: number): Promise<string> {
  const privateKey = process.env.TOKESHARE_USDC_SENDER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('TOKESHARE_USDC_SENDER_PRIVATE_KEY is not configured');
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http('https://base.llamarpc.com'),
  });

  const publicClient = PUBLIC_CLIENTS[Blockchain.Base];

  const amountInUnits = parseUnits(usdcAmount.toFixed(USDC_DECIMALS), USDC_DECIMALS);

  const txHash = await walletClient.writeContract({
    address: USDC_BASE_ADDRESS,
    abi: ERC20_TRANSFER_ABI,
    functionName: 'transfer',
    args: [recipientAddress, amountInUnits],
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return txHash;
}

export async function verifyTFTTransfer(
  txHash: `0x${string}`,
  expectedSender: Address,
  expectedRecipient: Address,
): Promise<{ verified: boolean; amount: bigint }> {
  const publicClient = PUBLIC_CLIENTS[Blockchain.Base];

  const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

  if (receipt.status !== 'success') {
    return { verified: false, amount: BigInt(0) };
  }

  const tftAddress = CONTRACTS.TFT_001.toLowerCase();

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== tftAddress) continue;

    try {
      const decoded = decodeEventLog({
        abi: TRANSFER_EVENT_ABI,
        data: log.data,
        topics: log.topics,
      });

      if (
        decoded.eventName === 'Transfer' &&
        decoded.args.from.toLowerCase() === expectedSender.toLowerCase() &&
        decoded.args.to.toLowerCase() === expectedRecipient.toLowerCase()
      ) {
        return { verified: true, amount: decoded.args.value };
      }
    } catch {
      continue;
    }
  }

  return { verified: false, amount: BigInt(0) };
}
