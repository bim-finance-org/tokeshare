'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white/80 ring-1 ring-inset ring-white/15 transition-colors hover:bg-red-500/80 hover:text-white hover:ring-red-400/40"
    >
      <LogOut className="h-3.5 w-3.5" />
      Sign out
    </button>
  );
}
