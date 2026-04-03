import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTransactionEmail } from '@/utils/email/sendEmail';
import { sendUSDC, verifyTFTTransfer } from '@/lib/usdc-transfer';
import { TFT_001_SELL_FEES } from '@/constants/api';
import { TOKESHARE_TFT_RECIPIENT } from '@/hooks/useTFTTransfer';
import { Address } from 'viem';

const REQUIRED_FIELDS = ['txHash', 'walletAddress', 'email', 'fullName', 'ref', 'cryptoAmount', 'fiatAmount', 'blockchain'];

function hasRequiredFields(data: any) {
  return REQUIRED_FIELDS.every((field) => data[field]);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!hasRequiredFields(data)) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // Check txHash not already used (prevent double-spend)
    const existing = await prisma.sellTransaction.findFirst({
      where: { txHash: data.txHash },
    });
    if (existing) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 409 });
    }

    // Verify TFT_001 transfer on-chain
    const { verified } = await verifyTFTTransfer(
      data.txHash as `0x${string}`,
      data.walletAddress as Address,
      TOKESHARE_TFT_RECIPIENT,
    );

    if (!verified) {
      return NextResponse.json({ error: 'TFT_001 transfer verification failed' }, { status: 400 });
    }

    const fiatAmount = parseFloat(data.fiatAmount);
    const fees = parseFloat((fiatAmount * TFT_001_SELL_FEES).toFixed(2));
    const usdcPayout = fiatAmount - fees;

    // Create transaction record first with pending USDC status
    const newTransaction = await prisma.sellTransaction.create({
      data: {
        ref: data.ref,
        date: new Date(),
        email: data.email,
        fullName: data.fullName,
        iban: null,
        status: 'usdc_pending',
        blockchain: data.blockchain,
        fiat: 'USDC',
        fiatAmount: fiatAmount,
        crypto: 'TFT_001',
        cryptoAmount: parseFloat(data.cryptoAmount),
        fees: fees,
        paymentMethod: 'usdc_transfer',
        walletAddress: data.walletAddress,
        txHash: data.txHash,
      },
    });

    // Send USDC to seller
    let usdcTxHash: string;
    try {
      usdcTxHash = await sendUSDC(data.walletAddress as Address, usdcPayout);
    } catch (usdcError) {
      console.error('USDC transfer failed:', usdcError);
      return NextResponse.json(
        { error: 'USDC transfer failed. Your TFT_001 tokens have been received. Please contact support.', ref: newTransaction.ref },
        { status: 500 },
      );
    }

    // Update transaction with USDC tx hash and completed status
    const updatedTransaction = await prisma.sellTransaction.update({
      where: { id: newTransaction.id },
      data: {
        usdcTxHash: usdcTxHash,
        status: 'completed',
      },
    });

    // Send confirmation email
    try {
      await sendTransactionEmail({
        email: data.email,
        fullName: data.fullName,
        transactionRef: newTransaction.ref,
        transactionType: 'sell',
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    return NextResponse.json({ ...updatedTransaction, usdcTxHash }, { status: 201 });
  } catch (error) {
    console.error('Error processing USDC sell:', error);
    return NextResponse.json({ error: 'Error processing USDC sell transaction' }, { status: 500 });
  }
}
