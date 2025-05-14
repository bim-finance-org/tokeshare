import { PrismaClient } from '@prisma/client';

// Évite la multiplication des connexions en développement
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Exemples de fonction pour les transactions sell
export async function getAllSellTransactions() {
  return await prisma.sellTransaction.findMany();
}

export async function getSellTransactionByRef(ref: string) {
  return await prisma.sellTransaction.findUnique({
    where: { ref },
  });
}

export async function createSellTransaction(data: {
  status: string;
  iban: string;
  blockchain: string;
  fiat: string;
  amount: number;
  ref: string;
  date: Date;
  email: string;
  fullName: string;
}) {
  return await prisma.sellTransaction.create({
    data,
  });
}

export async function updateSellTransactionStatus(ref: string, status: string) {
  return await prisma.sellTransaction.update({
    where: { ref },
    data: { status },
  });
}

// Exemples de fonction pour les transactions buy
export async function getAllBuyTransactions() {
  return await prisma.buyTransaction.findMany();
}

export async function getBuyTransactionByRef(ref: string) {
  return await prisma.buyTransaction.findUnique({
    where: { ref },
  });
}

export async function createBuyTransaction(data: {
  status: string;
  walletAddress: string;
  blockchain: string;
  crypto: string;
  amount: number;
  ref: string;
  date: Date;
  email: string;
  cvu: string;
}) {
  return await prisma.buyTransaction.create({
    data,
  });
}

export async function updateBuyTransactionStatus(ref: string, status: string) {
  return await prisma.buyTransaction.update({
    where: { ref },
    data: { status },
  });
}