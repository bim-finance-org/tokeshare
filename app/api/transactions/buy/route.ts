import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/app/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
    if (!data.walletAddress || !data.blockchain || !data.crypto || !data.amount || !data.email || !data.fiatCurrency || !data.ref) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }
    
    
    // Récupérer les fees ou calculer par défaut (2.5% du montant)
    const amount = parseFloat(data.amount);
    const fees = data.fees !== undefined 
      ? parseFloat(data.fees) 
      : parseFloat((amount * 0.025).toFixed(8));
    
    // Création de la transaction
    const newTransaction = await prisma.buyTransaction.create({
      data: {
        status: data.status || 'pending',
        walletAddress: data.walletAddress,
        blockchain: data.blockchain,
        crypto: data.crypto,
        fiatCurrency: data.fiatCurrency,
        amount: amount,
        fees: fees,
        ref: data.ref,
        date: new Date(),
        email: data.email,
        cvu: data.cvu || ''
      }
    });
    
    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la transaction d\'achat:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la transaction' },
      { status: 500 }
    );
  }
} 