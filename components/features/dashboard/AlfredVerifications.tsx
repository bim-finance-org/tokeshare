'use client';

// Operator console for the Alfred off-ramp's one manual step.
//
// Alfred has no API to mint its hosted verification link, so when a user opens
// an Alfred account the operators get an email; here they paste the link copied
// from Alfred's dashboard (Customers → the customer → verification link) and
// the user receives it by email and in their withdrawal panel.

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Copy, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ConsoleCard, { FieldLabel } from './ConsoleCard';
import { ALFRED_ENABLED } from '@/config/alfred';
import { notify } from '@/lib/notify';

interface AdminCustomer {
  network: string;
  address: string;
  corridor: string;
  customerId: string;
  email: string;
  status: string;
  kycUrl: string | null;
  kycUrlSetAt: string | null;
  adminNotifiedAt: string | null;
  createdAt: string;
}

const ALFRED_DASHBOARD_URL = 'https://dashboard.alfredpay.io';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  REJECTED: 'bg-red-50 text-red-600 ring-red-100',
  OFFBOARDED: 'bg-gray-50 text-gray-500 ring-gray-200',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
      STATUS_STYLES[status] ?? 'bg-amber-50 text-amber-600 ring-amber-100'
    }`}
  >
    {status.replace(/_/g, ' ').toLowerCase()}
  </span>
);

const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

const copy = (value: string, label: string) =>
  navigator.clipboard.writeText(value).then(
    () => notify.success(`${label} copied`),
    (err) => notify.error(err),
  );

const PendingRow = ({ customer, onSaved }: { customer: AdminCustomer; onSaved: () => void }) => {
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/stellar/ramp/alfred/admin/kyc-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: customer.network,
          address: customer.address,
          corridor: customer.corridor,
          url,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { emailed?: boolean; error?: string };
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      if (body.emailed) notify.success('Link saved', `Emailed to ${customer.email}.`);
      else notify.error('Link saved, but the email could not be sent. The user still sees it in their panel.');
      setUrl('');
      onSaved();
    } catch (err) {
      notify.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-color4">{customer.email}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {customer.corridor} · {customer.network} · wallet {shortAddress(customer.address)} · since{' '}
            {new Date(customer.createdAt).toLocaleDateString()}
            {!customer.adminNotifiedAt && <span className="ml-1 text-amber-600">· alert email not sent</span>}
          </p>
        </div>
        <StatusBadge status={customer.status} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <FieldLabel>Alfred customer ID</FieldLabel>
        <code className="rounded bg-color1 px-2 py-0.5 text-color4">{customer.customerId}</code>
        <button
          type="button"
          onClick={() => copy(customer.customerId, 'Customer ID')}
          className="inline-flex items-center gap-1 text-gray-500 hover:text-color4"
        >
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
      </div>

      {customer.kycUrl && (
        <p className="mt-2 text-xs text-gray-500">
          Link sent {customer.kycUrlSetAt && new Date(customer.kycUrlSetAt).toLocaleString()} — waiting for the user to
          complete it. Paste a new one below to replace and resend it.
        </p>
      )}

      <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={save}>
        <Input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Verification link copied from Alfred's dashboard"
          className="h-10 flex-1"
        />
        <button
          type="submit"
          disabled={saving || !url}
          className="h-10 rounded-full bg-color4 px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Sending…' : customer.kycUrl ? 'Replace & resend' : 'Send to user'}
        </button>
      </form>
    </li>
  );
};

const AlfredVerifications = () => {
  const query = useQuery({
    queryKey: ['alfred-admin-customers'],
    enabled: ALFRED_ENABLED,
    refetchInterval: 60_000,
    queryFn: async (): Promise<{ pending: AdminCustomer[]; recent: AdminCustomer[] }> => {
      const res = await fetch('/api/stellar/ramp/alfred/admin/customers');
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      return body;
    },
  });

  if (!ALFRED_ENABLED) return null;

  const pending = query.data?.pending ?? [];
  const recent = query.data?.recent ?? [];

  return (
    <ConsoleCard
      icon={BadgeCheck}
      title="Alfred identity verifications"
      subtitle="Relay each new customer's verification link from Alfred's dashboard."
      aside={
        <a
          href={ALFRED_DASHBOARD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-color1 px-3 py-1 text-xs font-semibold text-color4 ring-1 ring-inset ring-black/5 hover:opacity-80"
        >
          Alfred dashboard <ExternalLink className="h-3.5 w-3.5" />
        </a>
      }
    >
      {query.isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {query.error && <p className="text-sm text-red-600">{(query.error as Error).message}</p>}

      {query.data && pending.length === 0 && (
        <p className="text-sm text-gray-500">No customer is waiting for a verification link.</p>
      )}
      {pending.length > 0 && (
        <>
          <p className="text-sm text-gray-600">
            In Alfred&apos;s dashboard, open <span className="font-medium">Customers</span>, find the customer ID, copy
            its verification link and paste it here.
          </p>
          <ul className="mt-2 divide-y divide-gray-100">
            {pending.map((customer) => (
              <PendingRow
                key={`${customer.network}:${customer.address}:${customer.corridor}`}
                customer={customer}
                onSaved={() => void query.refetch()}
              />
            ))}
          </ul>
        </>
      )}

      {recent.length > 0 && (
        <div className="mt-6">
          <FieldLabel>Recently settled</FieldLabel>
          <ul className="mt-2 divide-y divide-gray-100">
            {recent.map((customer) => (
              <li
                key={`${customer.network}:${customer.address}:${customer.corridor}`}
                className="flex items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="truncate text-gray-600">
                  {customer.email} <span className="text-xs text-gray-400">· {customer.corridor}</span>
                </span>
                <StatusBadge status={customer.status} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </ConsoleCard>
  );
};

export default AlfredVerifications;
