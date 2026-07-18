import { describe, it, expect } from 'vitest';
import { EmailSubscriptionSchema } from './transactions';

describe('EmailSubscriptionSchema', () => {
  it('accepts a valid email', () => {
    const r = EmailSubscriptionSchema.safeParse({ email: 'alice@example.com' });
    expect(r.success).toBe(true);
  });

  it('rejects a malformed email', () => {
    expect(EmailSubscriptionSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
    expect(EmailSubscriptionSchema.safeParse({ email: '' }).success).toBe(false);
  });

  it('rejects a missing email', () => {
    expect(EmailSubscriptionSchema.safeParse({}).success).toBe(false);
  });

  it('rejects an over-long email (>255)', () => {
    const long = `${'a'.repeat(250)}@example.com`;
    expect(EmailSubscriptionSchema.safeParse({ email: long }).success).toBe(false);
  });
});
