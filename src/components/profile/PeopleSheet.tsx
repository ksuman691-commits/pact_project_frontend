'use client'

import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { useBackToClose } from '@/hooks/useBackToClose'

interface Person {
  id: number | string
  username: string
  full_name?: string | null
  avatar_url?: string | null
}

/** Followers / following list as a bottom sheet, in the light theme. */
export default function PeopleSheet({ open, title, people, emptyText, onClose }: { open: boolean; title: string; people: Person[]; emptyText: string; onClose: () => void }) {
  const router = useRouter()
  useBackToClose(open, onClose)
  if (!open) return null
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[90] flex items-end justify-center">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0" style={{ background: 'rgba(15,16,20,0.55)' }} />
      <div className="relative max-h-[75vh] w-full max-w-md overflow-y-auto rounded-t-[28px] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3" style={{ background: '#FBF8F1' }}>
        <div className="mx-auto mb-2 h-[5px] w-10 rounded-full" style={{ background: '#D9D2C2' }} />
        <div className="flex items-center justify-between">
          <div className="text-[18px] font-extrabold" style={{ color: '#17181D' }}>{title}</div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 flex size-11 items-center justify-center" style={{ color: '#17181D' }}>
            <X className="size-5" />
          </button>
        </div>
        {people.length === 0 ? (
          <div className="py-10 text-center text-[14px]" style={{ color: '#5A5C63' }}>{emptyText}</div>
        ) : (
          <div className="flex flex-col">
            {people.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => {
                  onClose()
                  router.push(`/profile/${encodeURIComponent(person.username)}`)
                }}
                className="flex min-h-14 items-center gap-3 rounded-[14px] px-1 text-left"
              >
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-[14px] font-extrabold" style={{ background: '#17181D', color: '#FFFFFF' }}>
                  {person.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={person.avatar_url} alt="" className="size-full object-cover" />
                  ) : (
                    (person.full_name || person.username).charAt(0).toUpperCase()
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-bold" style={{ color: '#17181D' }}>{person.full_name || person.username}</span>
                  <span className="block truncate text-[13px]" style={{ color: '#5A5C63' }}>@{person.username}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
