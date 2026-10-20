import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ prisma: {} }));

const { endorsementCleared } = await import('./offramp');

// An endorsement only unlocks the endpoint when BOTH gates have cleared:
// Alfred's own status and every provider-side approval. "Approved but the
// provider is still processing" must not read as ready.
describe('endorsementCleared', () => {
  it('is false when the endorsement does not exist yet', () => {
    expect(endorsementCleared(undefined)).toBe(false);
  });

  it('is false until Alfred approves', () => {
    expect(endorsementCleared({ endorsement: 'stablecoin_payin', endorsement_status: 'INCOMPLETE' })).toBe(false);
  });

  it('is false when approved but a provider is still pending', () => {
    expect(
      endorsementCleared({
        endorsement: 'stablecoin_payin',
        endorsement_status: 'APPROVED',
        provider_endorsements: [{ provider: 'p', name: 'n', status: 'pending' }],
        reason_code: 'provider_processing',
      }),
    ).toBe(false);
  });

  it('is true when approved with every provider approved, or none required', () => {
    expect(
      endorsementCleared({
        endorsement: 'stablecoin_payin',
        endorsement_status: 'APPROVED',
        provider_endorsements: [{ provider: 'p', name: 'n', status: 'approved' }],
      }),
    ).toBe(true);
    expect(endorsementCleared({ endorsement: 'stablecoin_balance', endorsement_status: 'APPROVED' })).toBe(true);
  });

  it('is false once paused or revoked', () => {
    expect(endorsementCleared({ endorsement: 'stablecoin_payin', endorsement_status: 'PAUSED' })).toBe(false);
    expect(endorsementCleared({ endorsement: 'stablecoin_payin', endorsement_status: 'REVOKED' })).toBe(false);
  });
});
