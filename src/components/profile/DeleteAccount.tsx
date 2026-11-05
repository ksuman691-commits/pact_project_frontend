'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { clearToken } from '@/services/api';
import { useAuthStore } from '@/store/auth';

const INK = '#17181D';
const MUTED = '#5A5C63';
const LINE = '#DCD3C1';
const RED = '#B42318';

/** Settings row + typed-DELETE confirmation. The server keeps the account for
 *  30 days; signing in again during that time cancels the deletion. */
export default function DeleteAccount() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = typed.trim() === 'DELETE';

  const confirm = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      await api.delete('/api/users/me', { data: { confirm: 'DELETE' } });
      // The server already ended every session, so sign out locally only
      // (calling /logout would 401 and hard-redirect, losing this message).
      clearToken();
      useAuthStore.setState({ token: null });
      setUser(null);
      toast.success('Your account will be deleted in 30 days. Sign in before then to keep it.', { duration: 6000 });
      router.replace('/auth/login');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Could not delete your account. Try again.');
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex min-h-14 w-full items-center gap-3 rounded-[18px] px-4 text-left"
        style={{ background: 'var(--card)', border: `1px solid ${LINE}` }}
      >
        <span className="flex size-9 items-center justify-center rounded-full" style={{ background: '#FDECEA', color: RED }}>
          <Trash2 className="size-4" strokeWidth={2.4} />
        </span>
        <span className="flex-1 text-[15px] font-bold" style={{ color: RED }}>Delete account</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={() => !busy && setOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-[24px] p-5 pb-8 sm:rounded-[24px]" style={{ background: 'var(--paper)', color: INK }}>
            <h2 id="delete-title" className="text-[19px] font-extrabold">Delete your account?</h2>
            <ul className="mt-3 space-y-2 text-[14px] leading-snug" style={{ color: MUTED }}>
              <li>• Your profile disappears right away and you&apos;re signed out everywhere.</li>
              <li>• <b style={{ color: INK }}>Changed your mind?</b> Just sign in within 30 days and everything comes back.</li>
              <li>• After 30 days your pacts, proofs, comments and photos are deleted. Circles you run pass to their longest member.</li>
              <li>• Paid pacts people have bought stay until they end, without your name. Tip records are kept without your name.</li>
            </ul>
            <label className="mt-5 block">
              <span className="text-[13px] font-bold">Type DELETE to confirm</span>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoCapitalize="characters"
                autoComplete="off"
                className="mt-2 h-12 w-full rounded-[14px] px-4 text-[16px] outline-none"
                style={{ border: `1.5px solid ${LINE}`, background: '#FFFFFF', color: INK }}
              />
            </label>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="h-12 rounded-full text-[15px] font-bold" style={{ border: `1.5px solid ${LINE}`, color: INK }}>
                Keep my account
              </button>
              <button type="button" onClick={() => void confirm()} disabled={!ready || busy} className="h-12 rounded-full text-[15px] font-extrabold text-white disabled:opacity-40" style={{ background: RED }}>
                {busy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
