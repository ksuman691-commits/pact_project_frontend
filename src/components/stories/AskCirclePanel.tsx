'use client'

import { useState } from 'react'
import { Check, HelpCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { socialService } from '@/services/api'
import { queryKeys } from '@/lib/queryKeys'

const IDEAS: { question: string; options?: [string, string] }[] = [
  { question: 'What should I try tomorrow?' },
  { question: 'Rate this 1 to 10' },
  { question: "Who's joining me tomorrow?", options: ["I'm in", 'Not this time'] },
  { question: 'Any tips?' },
]

/**
 * After a moment is posted: "Ask your circle". Optional and one step: a question,
 * and, if they like, two answers people can tap. It shows under the photo on the card.
 */
export default function AskCirclePanel({ pactId, proofId, dark = false }: { pactId: number; proofId: number; dark?: boolean }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [withAnswers, setWithAnswers] = useState(false)
  const [answers, setAnswers] = useState<[string, string]>(['', ''])
  const [saving, setSaving] = useState(false)
  const [asked, setAsked] = useState<string | null>(null)

  const ink = dark ? '#FFFFFF' : '#17181D'
  const muted = dark ? 'rgba(255,255,255,0.75)' : '#5B5E6B'
  const field = dark
    ? { background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.28)', color: '#FFFFFF' }
    : { background: '#FFFFFF', border: '1px solid rgba(23,24,29,0.14)', color: '#17181D' }

  const ready = question.trim().length > 0 && (!withAnswers || (answers[0].trim() && answers[1].trim()))

  const save = async () => {
    if (!ready || saving) return
    setSaving(true)
    try {
      await socialService.setMomentQuestion(pactId, proofId, question.trim(), withAnswers ? answers.map((a) => a.trim()) : [])
      setAsked(question.trim())
      void queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed.all })
      void queryClient.invalidateQueries({ queryKey: ['my-pacts'] })
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Couldn't add the question. Try again.")
    } finally {
      setSaving(false)
    }
  }

  if (asked) {
    return (
      <p className="flex items-center justify-center gap-1.5 text-[14px] font-bold" style={{ color: ink }} aria-live="polite">
        <Check className="size-4" strokeWidth={3} aria-hidden="true" />
        Asked: {asked}
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-extrabold"
        style={dark ? { background: 'rgba(255,255,255,0.16)', color: '#FFFFFF' } : { border: '1.5px solid #1F3A93', color: '#1F3A93' }}
      >
        <HelpCircle className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
        Ask your circle
      </button>
    )
  }

  return (
    <div className="w-full text-left">
      <label htmlFor="ask-q" className="text-[14px] font-extrabold" style={{ color: ink }}>Ask your circle</label>
      <p className="text-[12.5px]" style={{ color: muted }}>It shows under your photo. A question gets people talking.</p>
      <input
        id="ask-q"
        type="text"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        maxLength={140}
        placeholder="Lake loop or the hill tomorrow?"
        className="mt-2 h-11 w-full rounded-[14px] px-3.5 text-[15px] font-semibold focus:outline-none"
        style={field}
        autoFocus
      />
      {!question && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {IDEAS.map((idea) => (
            <button
              key={idea.question}
              type="button"
              onClick={() => {
                setQuestion(idea.question)
                if (idea.options) {
                  setWithAnswers(true)
                  setAnswers(idea.options)
                }
              }}
              className="h-8 rounded-full px-3 text-[12.5px] font-bold"
              style={field}
            >
              {idea.question}
            </button>
          ))}
        </div>
      )}
      <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-between gap-3 text-[13.5px] font-bold" style={{ color: ink }}>
        Let people tap an answer
        <input type="checkbox" checked={withAnswers} onChange={(event) => setWithAnswers(event.target.checked)} className="size-5 accent-[#1F3A93]" />
      </label>
      {withAnswers && (
        <div className="grid grid-cols-2 gap-2">
          {[0, 1].map((index) => (
            <input
              key={index}
              type="text"
              value={answers[index]}
              onChange={(event) => setAnswers((prev) => (index === 0 ? [event.target.value, prev[1]] : [prev[0], event.target.value]))}
              maxLength={24}
              placeholder={index === 0 ? 'Lake' : 'Hill'}
              aria-label={`Answer ${index + 1}`}
              className="h-10 rounded-full px-3.5 text-[14px] font-bold focus:outline-none"
              style={field}
            />
          ))}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="h-12 flex-1 rounded-full text-[15px] font-bold" style={{ color: ink, ...(dark ? { background: 'rgba(255,255,255,0.12)' } : { border: '1px solid rgba(23,24,29,0.14)' }) }}>
          Not now
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!ready || saving}
          className="flex h-12 flex-[1.4] items-center justify-center rounded-full text-[15px] font-extrabold disabled:opacity-50"
          style={dark ? { background: '#FFFFFF', color: '#1F3A93' } : { background: '#1F3A93', color: '#FFFFFF' }}
        >
          {saving ? <Loader className="size-4 animate-spin" /> : 'Ask'}
        </button>
      </div>
    </div>
  )
}
