import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendTransactionEmail } from '@/app/utils/email/sendEmail';

// GET pour récupérer toutes les transactions d'achat
export async function GET(_request: NextRequest) {
  try {
    // Vérifier si l'utilisateur est authentifié
    const session = await getServerSession(authOptions);
    
    // Si pas de session, renvoyer une erreur 401 Unauthorized
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé. Veuillez vous connecter.' },
        { status: 401 }
      );
    }
    
    // L'utilisateur est authentifié, récupérer les données
    const buyTransactions = await prisma.buyTransaction.findMany({
      orderBy: {
        date: 'desc'
      }
    });
    
    return NextResponse.json(buyTransactions);
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions d\'achat:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des transactions' },
      { status: 500 }
    );
  }
}

// POST pour créer une nouvelle transaction d'achat
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validation des données
    if (!data.walletAddress || !data.blockchain || !data.crypto || !data.cryptoAmount || !data.email || !data.fiat || !data.fiatAmount || !data.ref) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }
    
    
    // Récupérer les fees ou calculer par défaut (2.5% du montant)
    const amount = parseFloat(data.amount);
    const fees = data.fees !== undefined 
      ? parseFloat(data.fees) 
      : parseFloat((amount * 0.025).toFixed(4));
    
    // Création de la transaction
    const newTransaction = await prisma.buyTransaction.create({
      data: {
        ref: data.ref,
        date: new Date(),
        email: data.email,
        fullName: data.fullName || '',
        cvu: data.cvu || '',  
        walletAddress: data.walletAddress,
        status: data.status || 'pending',
        blockchain: data.blockchain,
        fiat: data.fiat,
        fiatAmount: data.fiatAmount,
        crypto: data.crypto,
        cryptoAmount: data.cryptoAmount,
        fees: fees
      }
    });
    
    // Envoi d'email de confirmation
    try {
      await sendTransactionEmail({
        email: data.email,  
        fullName: data.fullName,
        transactionRef: newTransaction.ref,
        transactionType: 'buy',
        date: newTransaction.date.toLocaleDateString(),
        blockchain: data.blockchain,
        fiatSymbol: data.fiat,
        fiatAmount: data.fiatAmount,
        tokenSymbol: data.crypto,
        tokenAmount: data.cryptoAmount,
        walletAddress: data.walletAddress
      });
      console.log('Email de confirmation envoyé pour l\'achat');
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
      // On continue malgré l'erreur d'envoi d'email
    }
    
    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la transaction d\'achat:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la transaction' },
      { status: 500 }
    );
  }
} 

