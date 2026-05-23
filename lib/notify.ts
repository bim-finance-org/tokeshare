import { toast } from '@/hooks/use-toast';
import { parseError } from '@/lib/errors';

export const notify = {
  error(err: unknown, opts?: { title?: string; fallback?: string }) {
    const description = parseError(err) || opts?.fallback || 'An unexpected error occurred.';
    if (process.env.NODE_ENV !== 'production') {
      console.error(opts?.title ?? 'Error', err);
    }
    return toast({
      variant: 'destructive',
      title: opts?.title ?? 'Error',
      description,
    });
  },

  success(title: string, description?: string) {
    return toast({ title, description });
  },

  info(title: string, description?: string) {
    return toast({ title, description });
  },
};
