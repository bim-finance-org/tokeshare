import { PrismaClient } from '@prisma/client';

// Extends the type definition of PrismaClient
declare module '@prisma/client' {
  interface PrismaClient {
    emails: any;
    sellTransaction: any;
    buyTransaction: any;
  }
}

// Export empty to make it a module
export {};
