// Ce fichier est un exemple d'utilisation de Prisma avec vos modèles

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Créer un exemple de transaction Sell
    const sellTransaction = await prisma.sellTransaction.create({
      data: {
        status: 'pending',
        iban: 'FR7630001007941234567890185',
        blockchain: 'Ethereum',
        fiat: 'EUR',
        amount: 1000.50,
        ref: 'SELL002',
        date: new Date('2023-04-18'),
        email: 'user@example.com',
        fullName: 'John Doe'
      }
    });
    
    console.log('Transaction de vente créée:', sellTransaction);
    
    // Créer un exemple de transaction Buy
    const buyTransaction = await prisma.buyTransaction.create({
      data: {
        status: 'completed',
        walletAddress: '0xBB1FdC742068b50fcbCf86e6FE4B5E2F9838fE1A',
        blockchain: 'Bitcoin',
        crypto: 'BTC',
        amount: 0.05,
        ref: 'BUY002',
        date: new Date('2023-04-18'),
        email: 'user@example.com',
        cvu: 'CVU123456789'
      }
    });
    
    console.log('Transaction d\'achat créée:', buyTransaction);
    
    // Récupérer toutes les transactions
    const allSellTransactions = await prisma.sellTransaction.findMany();
    console.log('Toutes les transactions de vente:', allSellTransactions);
    
    const allBuyTransactions = await prisma.buyTransaction.findMany();
    console.log('Toutes les transactions d\'achat:', allBuyTransactions);
    
  } catch (error) {
    console.error('Erreur lors de l\'utilisation de Prisma:', error);
  } finally {
    // Déconnexion de Prisma
    await prisma.$disconnect();
  }
}

// Execution uniquement si appelé directement
if (require.main === module) {
  main()
    .catch(e => {
      console.error(e);
      process.exit(1);
    });
} 