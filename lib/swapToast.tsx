import { toast } from '@/hooks/use-toast';

export type SwapPhase = 'preparing' | 'processing';

const STEP_ORDER: SwapPhase[] = ['preparing', 'processing'];

const STEPS: Record<SwapPhase, { title: string; description: string; progress: number }> = {
  preparing: {
    title: 'Preparing swap',
    description: 'Checking balances and allowances. Approve any pending request in your wallet.',
    progress: 40,
  },
  processing: {
    title: 'Processing transaction',
    description: 'Your transaction is being processed on-chain. Please wait…',
    progress: 85,
  },
};

// Sticky enough to span an on-chain confirmation; the success/error toast
// replaces it anyway (TOAST_LIMIT = 1).
const PROGRESS_DURATION_MS = 1000 * 60 * 30;

const body = (phase: SwapPhase) => {
  const step = STEPS[phase];
  const index = STEP_ORDER.indexOf(phase);

  return (
    <div className="mt-1 space-y-2">
      <p className="text-sm text-white/90">{step.description}</p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white transition-[width] duration-700 ease-out"
          style={{ width: `${step.progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-white/70">
        <span>
          Step {index + 1} of {STEP_ORDER.length}
        </span>
        <span>{step.progress}%</span>
      </div>
    </div>
  );
};

/**
 * Shows a single themed toast that walks through the swap steps
 * (preparing → processing) with a progress bar. Returns a handle to advance the
 * phase; the existing success/error toasts take over when the swap settles.
 */
export const showSwapProgress = (initial: SwapPhase = 'preparing') => {
  const t = toast({
    variant: 'progress',
    title: STEPS[initial].title,
    description: body(initial),
    duration: PROGRESS_DURATION_MS,
  });

  return {
    setPhase(phase: SwapPhase) {
      t.update({ id: t.id, variant: 'progress', title: STEPS[phase].title, description: body(phase) });
    },
    dismiss: t.dismiss,
  };
};
