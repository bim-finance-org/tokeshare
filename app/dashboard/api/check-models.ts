import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Afficher tous les modèles disponibles
console.log('Modèles disponibles dans PrismaClient:', Object.keys(prisma));

// Afficher toutes les propriétés de PrismaClient
console.log('Toutes les propriétés de PrismaClient:', Object.getOwnPropertyNames(Object.getPrototypeOf(prisma)));

// Déconnecter Prisma
prisma.$disconnect(); 