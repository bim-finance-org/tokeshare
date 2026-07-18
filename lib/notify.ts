import type { ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { parseError } from '@/lib/errors';
import { getLogger } from '@/lib/logger';

const log = getLogger('notify');

export const notify = {
  error(err: unknown, opts?: { title?: string; fallback?: string }) {
    const description = typeof err === 'string' ? err : parseError(err) || opts?.fallback || 'An unexpected error occurred.';
    if (typeof err !== 'string') {
      log.error(opts?.title ?? 'Error', err);
    }
    return toast({
      variant: 'destructive',
      title: opts?.title ?? 'Error',
      description,
    });
  },

  success(title: string, description?: ReactNode) {
    return toast({ title, description });
  },

  info(title: string, description?: ReactNode) {
    return toast({ title, description });
  },
};
