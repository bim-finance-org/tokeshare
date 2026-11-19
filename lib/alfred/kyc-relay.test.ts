import { beforeEach, describe, expect, it, vi } from 'vitest';

// The manual KYC relay: Alfred has no API for its hosted verification link, so
// operators are alerted by email and paste the link, which is stored and then
// emailed to the user. Mail is best-effort on both legs; the stored state is not.

const db = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));
const mail = vi.hoisted(() => ({
  sendAdminNewCustomerAlert: vi.fn(),
  sendUserKycLink: vi.fn(),
}));
const alfred = vi.hoisted(() => ({
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: { alfredCustomer: db } }));
vi.mock('./notifications', () => mail);
vi.mock('./client', async (importOriginal) => ({ ...(await importOriginal<object>()), ...alfred }));

const { setKycLink, startOnboarding } = await import('./offramp');
const { AlfredKycLinkSchema } = await import('@/lib/schemas/alfred');
const { getCorridor } = await import('@/config/alfred');

const ADDRESS = `G${'A'.repeat(55)}`;
const corridor = getCorridor('MX_SPEI')!;

const row = (overrides: Record<string, unknown> = {}) => ({
  network: 'mainnet',
  address: ADDRESS,
  corridor: 'MX_SPEI',
  customerId: 'cus_1',
  email: 'user@example.com',
  status: 'NOT_STARTED',
  endorsementsReady: false,
  linkedAccountId: null,
  linkedAccountLast4: null,
  linkedAccountStatus: null,
  kycUrl: null,
  kycUrlSetAt: null,
  adminNotifiedAt: null,
  createdAt: new Date('2026-11-19T10:00:00Z'),
  updatedAt: new Date('2026-11-19T10:00:00Z'),
  ...overrides,
});

beforeEach(() => vi.resetAllMocks());

describe('startOnboarding', () => {
  beforeEach(() => {
    db.findUnique.mockResolvedValue(null);
    alfred.createCustomer.mockResolvedValue({ id: 'cus_1', status: 'NOT_STARTED' });
    alfred.updateCustomer.mockResolvedValue({});
    db.create.mockResolvedValue(row());
    db.update.mockResolvedValue(row());
  });

  it('alerts the operators and records when the alert went out', async () => {
    mail.sendAdminNewCustomerAlert.mockResolvedValue(undefined);
    await startOnboarding({ network: 'mainnet', address: ADDRESS, corridor, email: 'user@example.com' });

    expect(mail.sendAdminNewCustomerAlert).toHaveBeenCalledWith(expect.objectContaining({ customerId: 'cus_1' }));
    expect(db.update).toHaveBeenCalledWith(expect.objectContaining({ data: { adminNotifiedAt: expect.any(Date) } }));
  });

  it('still succeeds for the user when the alert email fails', async () => {
    mail.sendAdminNewCustomerAlert.mockRejectedValue(new Error('Resend down'));
    const state = await startOnboarding({ network: 'mainnet', address: ADDRESS, corridor, email: 'user@example.com' });

    expect(state.customerId).toBe('cus_1');
    expect(state.kycUrl).toBeNull();
    expect(db.update).not.toHaveBeenCalled();
  });

  it('does not alert again for an existing customer', async () => {
    db.findUnique.mockResolvedValue(row());
    await startOnboarding({ network: 'mainnet', address: ADDRESS, corridor, email: 'user@example.com' });
    expect(mail.sendAdminNewCustomerAlert).not.toHaveBeenCalled();
  });
});

describe('setKycLink', () => {
  const input = { network: 'mainnet', address: ADDRESS, corridor: 'MX_SPEI', url: 'https://verify.example/abc' };

  it('stores the link before emailing it to the user', async () => {
    db.findUnique.mockResolvedValue(row());
    db.update.mockResolvedValue(row({ kycUrl: input.url, kycUrlSetAt: new Date() }));
    mail.sendUserKycLink.mockResolvedValue(undefined);

    const result = await setKycLink(input);

    expect(db.update.mock.invocationCallOrder[0]).toBeLessThan(mail.sendUserKycLink.mock.invocationCallOrder[0]);
    expect(mail.sendUserKycLink).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@example.com' }),
      input.url,
    );
    expect(result).toMatchObject({ emailed: true, customer: { kycUrl: input.url } });
  });

  it('keeps the link when the email fails, and says so', async () => {
    db.findUnique.mockResolvedValue(row());
    db.update.mockResolvedValue(row({ kycUrl: input.url, kycUrlSetAt: new Date() }));
    mail.sendUserKycLink.mockRejectedValue(new Error('Resend down'));

    const result = await setKycLink(input);
    expect(result).toMatchObject({ emailed: false, customer: { kycUrl: input.url } });
  });

  it('refuses an unknown or already verified customer', async () => {
    db.findUnique.mockResolvedValue(null);
    await expect(setKycLink(input)).rejects.toMatchObject({ status: 404 });

    db.findUnique.mockResolvedValue(row({ status: 'ACTIVE' }));
    await expect(setKycLink(input)).rejects.toMatchObject({ status: 400 });
    expect(db.update).not.toHaveBeenCalled();
  });
});

describe('AlfredKycLinkSchema', () => {
  const base = { network: 'mainnet', address: ADDRESS, corridor: 'MX_SPEI' };

  it('accepts an https link, trimmed', () => {
    const parsed = AlfredKycLinkSchema.parse({ ...base, url: '  https://verify.example/abc  ' });
    expect(parsed.url).toBe('https://verify.example/abc');
  });

  it('rejects anything that is not an https URL', () => {
    for (const url of ['http://verify.example/abc', 'javascript:alert(1)', 'verify.example/abc', '']) {
      expect(AlfredKycLinkSchema.safeParse({ ...base, url }).success).toBe(false);
    }
  });
});
