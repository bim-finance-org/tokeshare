import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { ALLOWED_STATUS } from '@/constants/api';

type AllowedStatus = (typeof ALLOWED_STATUS)[number];

export function validateStatus(status: unknown): status is AllowedStatus {
  return typeof status === 'string' && (ALLOWED_STATUS as readonly string[]).includes(status);
}

export function validateId(id: unknown): number | null {
  const parsed = parseInt(String(id), 10);
  return isNaN(parsed) ? null : parsed;
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  return session;
}

export function validateCryptoAmount(amount: number): number | null {
  return isNaN(amount) || amount <= 0 ? null : amount;
}
