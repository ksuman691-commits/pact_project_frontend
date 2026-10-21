'use client'

import Link from 'next/link'
import { ChevronRight, IndianRupee } from 'lucide-react'
import { useMyTipSettings } from '@/hooks/useTips'

/** On your own profile: shows whether tips are on and links to the settings. */
export default function TipsEntryCard({ className = '' }: { className?: string }) {
  const { data } = useMyTipSettings()
  const on = Boolean(data?.enabled && data?.upi_id)
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
