'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, QrCode } from 'lucide-react'
import toast from 'react-hot-toast'
import { CircleQR } from '@/components/CircleQR'
import { useSmartBack } from '@/hooks/useSmartBack'
import { useMyTipSettings, useSaveMyTipSettings } from '@/hooks/useTips'
import { buildUpiUri, isValidUpiId, parseUpiUri, readQrFromImage } from '@/lib/upi'
import { useAuthStore } from '@/store/auth'

const INK = '#0F1014'
const MUTED = '#5F6168'
const NAVY = '#1F3A93'
const LINE = '#E6E6E9'

export default function TipSettingsPage() {
  const goBack = useSmartBack('/profile')
  const { user } = useAuthStore()
  const { data, isLoading } = useMyTipSettings(Boolean(user))
  const save = useSaveMyTipSettings()
  const fileRef = useRef<HTMLInputElement>(null)
  const [upiId, setUpiId] = useState('')
  const [payeeName, setPayeeName] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [reading, setReading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!data || loaded) return
    setUpiId(data.upi_id || '')
    setPayeeName(data.payee_name || user?.full_name || '')
    setEnabled(Boolean(data.enabled))
    setLoaded(true)
  }, [data, loaded, user?.full_name])

  const trimmed = upiId.trim()
  const valid = isValidUpiId(trimmed)
  const showError = trimmed.length > 0 && !valid

  const onPickQr = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setReading(true)
    try {
      const text = await readQrFromImage(file)
      const parsed = text ? parseUpiUri(text) : null
      if (!parsed) {
        toast.error("Couldn't find a UPI QR in that image. Try a clearer screenshot, or type your UPI ID.")
        return
      }
      setUpiId(parsed.upiId)
      if (parsed.payeeName) setPayeeName(parsed.payeeName)
      setEnabled(true)
      toast.success('UPI ID read from your QR')
    } finally {
      setReading(false)
    }
  }

  const onSave = async () => {
    if (enabled && !valid) {
      toast.error('Add a valid UPI ID first, like name@okaxis')
      return
    }
    try {
      await save.mutateAsync({ upi_id: trimmed || null, payee_name: payeeName.trim() || null, enabled: enabled && valid })
      toast.success(enabled ? 'Tips are on' : 'Saved')
      goBack()
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Could not save')
    }
  }

  if (!user) return null

  return (
    <main className="min-h-screen" style={{ background: '#FFFFFF', color: INK }}>
      <div className="mx-auto max-w-md px-4 pb-10">
        <header className="flex h-14 items-center">
          <button type="button" onClick={goBack} aria-label="Go back" className="-ml-2 flex size-11 items-center justify-center rounded-full" style={{ color: INK }}>
            <ChevronLeft className="size-6" />
          </button>
          <div className="flex-1 text-center text-[16px] font-bold" style={{ color: INK }}>Tips</div>
          <span className="size-11" />
        </header>

        <div className="mt-2 text-[26px] font-extrabold leading-tight tracking-[-0.025em]" style={{ color: INK }}>Let people tip you</div>
        <div className="mt-2 text-[15px] leading-relaxed" style={{ color: MUTED }}>
          A Tip button shows on your pacts and your profile. Tips go straight to your UPI. CirclePact never sees or holds the money.
        </div>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={reading}
          className="mt-6 flex w-full items-center gap-3 rounded-[18px] px-4 py-4 text-left disabled:opacity-60"
          style={{ border: `1.5px dashed ${NAVY}`, background: '#F5F7FD' }}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full" style={{ background: NAVY, color: '#FFFFFF' }}>
            <QrCode className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-extrabold" style={{ color: INK }}>{reading ? 'Reading your QR…' : 'Upload your GPay QR'}</span>
            <span className="block text-[13px]" style={{ color: MUTED }}>A screenshot of your scan-to-pay QR works. We read the UPI ID from it.</span>
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => void onPickQr(e)} tabIndex={-1} aria-hidden="true" />

        <div className="my-5 flex items-center gap-3 text-[12px] font-bold tracking-[0.08em]" style={{ color: MUTED }}>
          <span className="h-px flex-1" style={{ background: LINE }} />
          OR TYPE IT
          <span className="h-px flex-1" style={{ background: LINE }} />
        </div>

        <label className="block">
          <span className="block text-[13px] font-bold" style={{ color: INK }}>UPI ID</span>
          <input
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="yourname@okaxis"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="email"
            disabled={isLoading}
            className="mt-2 h-12 w-full rounded-[14px] px-4 text-[16px] outline-none"
            style={{ border: `1.5px solid ${showError ? '#C0392B' : LINE}`, color: INK, background: '#FFFFFF' }}
          />
          {showError && <span className="mt-1 block text-[13px]" style={{ color: '#C0392B' }}>That doesn&apos;t look like a UPI ID. It should look like name@bank.</span>}
        </label>

        <label className="mt-4 block">
          <span className="block text-[13px] font-bold" style={{ color: INK }}>Name people see</span>
          <input
            value={payeeName}
            onChange={(e) => setPayeeName(e.target.value)}
            maxLength={100}
            placeholder="Your name"
            className="mt-2 h-12 w-full rounded-[14px] px-4 text-[16px] outline-none"
            style={{ border: `1.5px solid ${LINE}`, color: INK, background: '#FFFFFF' }}
          />
        </label>

        <div className="mt-5 flex items-center gap-3 rounded-[18px] px-4 py-3" style={{ border: `1px solid ${LINE}` }}>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-extrabold" style={{ color: INK }}>Show the Tip button</div>
            <div className="text-[13px]" style={{ color: MUTED }}>On your pacts and your profile</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Show the Tip button"
            onClick={() => setEnabled((on) => !on)}
            className="relative h-8 w-[52px] shrink-0 rounded-full transition-colors"
            style={{ background: enabled ? NAVY : '#D4D5D9' }}
          >
            <span className="absolute top-1 size-6 rounded-full transition-all" style={{ background: '#FFFFFF', left: enabled ? 24 : 4, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </button>
        </div>

        {valid && enabled && (
          <div className="mt-5 flex items-center gap-4 rounded-[18px] px-4 py-4" style={{ background: '#F7F7F8' }}>
            <div className="rounded-[12px] p-2" style={{ background: '#FFFFFF' }}>
              <CircleQR url={buildUpiUri({ upiId: trimmed, payeeName: payeeName.trim() || undefined })} size={88} label="Preview of your tip QR" />
            </div>
            <div className="min-w-0 text-[13px] leading-snug" style={{ color: MUTED }}>
              <span className="block text-[14px] font-extrabold" style={{ color: INK }}>This is what people scan</span>
              Scan it with another phone to check it opens your UPI.
            </div>
          </div>
        )}

        <div className="mt-5 text-[12.5px] leading-relaxed" style={{ color: MUTED }}>
          People who pay will see the name on your bank account. If your UPI ID is your phone number, consider making a separate UPI ID in your UPI app. Tips are gifts and are never tied to whether a pact is completed.
        </div>

        <button
          type="button"
          onClick={() => void onSave()}
          disabled={save.isPending || isLoading}
          className="mt-6 h-14 w-full rounded-full text-[16px] font-extrabold disabled:opacity-60"
          style={{ background: NAVY, color: '#FFFFFF' }}
        >
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </main>
  )
}
