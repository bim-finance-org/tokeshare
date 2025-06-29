import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { ALLOWED_STATUS } from '@/constants/api';

export function validateStatus(status: any): status is (typeof ALLOWED_STATUS)[number] {
  return typeof status === 'string' && ALLOWED_STATUS.includes(status as any);
}

export function validateId(id: string): number | null {
  const parsed = parseInt(id);
  return isNaN(parsed) ? null : parsed;
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  return session;
}

export function validateCryptoAmount(amount: number): number | null {
  return isNaN(amount) || amount <= 0 ? null : amount;
}
