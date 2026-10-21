'use client'

import Link from 'next/link'
import { ChevronRight, IndianRupee } from 'lucide-react'
import { useMyTipSettings, useTipInbox } from '@/hooks/useTips'

/** On your own profile: shows whether tips are on and links to the settings. */
export default function TipsEntryCard({ className = '' }: { className?: string }) {
  const { data } = useMyTipSettings()
  const on = Boolean(data?.enabled && data?.upi_id)
  const inbox = useTipInbox(on)
  const waiting = inbox.data?.waiting.length ?? 0
  const total = inbox.data?.confirmed_total ?? 0
  if (on && (waiting > 0 || total > 0)) {
    return (
      <Link href="/profile/tips/inbox" className={`flex items-center gap-3 rounded-[18px] px-4 py-3 ${className}`} style={{ background: waiting > 0 ? '#F5F7FD' : '#FFFFFF', border: waiting > 0 ? '1.5px solid #1F3A93' : '1px solid #E6E6E9' }}>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full" style={{ background: '#1F3A93', color: '#FFFFFF' }}>
          <IndianRupee className="size-5" strokeWidth={2.4} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-extrabold" style={{ color: '#0F1014' }}>{waiting > 0 ? `${waiting} ${waiting === 1 ? 'tip' : 'tips'} to confirm` : `₹${total.toLocaleString('en-IN')} in tips`}</span>
          <span className="block truncate text-[13px]" style={{ color: '#5F6168' }}>{waiting > 0 ? 'Check your UPI app, then confirm' : 'Confirmed by you'}</span>
        </span>
        <ChevronRight className="size-5 shrink-0" style={{ color: '#5F6168' }} />
      </Link>
    )
  }
  return (
    <Link
      href="/profile/tips"
      className={`flex items-center gap-3 rounded-[18px] px-4 py-3 ${className}`}
      style={{ background: on ? '#FFFFFF' : '#F5F7FD', border: on ? '1px solid #E6E6E9' : '1.5px dashed #1F3A93' }}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full" style={{ background: '#1F3A93', color: '#FFFFFF' }}>
        <IndianRupee className="size-5" strokeWidth={2.4} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-extrabold" style={{ color: '#0F1014' }}>{on ? 'Tips are on' : 'Let people tip you'}</span>
        <span className="block truncate text-[13px]" style={{ color: '#5F6168' }}>{on ? data?.upi_id : 'Add your UPI and a Tip button shows on your pacts'}</span>
      </span>
      <ChevronRight className="size-5 shrink-0" style={{ color: '#5F6168' }} />
    </Link>
  )
}
