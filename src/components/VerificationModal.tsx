'use client'

import React, { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
  pactId: number
  onSubmit?: () => void
}

export default function VerificationModal({
  isOpen,
  onClose,
  pactId,
  onSubmit,
}: VerificationModalProps) {
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState({
    q1_answer: '',
    q2_answer: '',
    q3_answer: '',
    q4_answer: '',
  })
  const [reasons, setReasons] = useState({
    q1_reason: '',
    q2_reason: '',
    q3_reason: '',
    q4_reason: '',
  })

  const questions = [
    { id: 'q1', label: 'What did you complete today?', placeholder: 'Describe your progress...' },
    { id: 'q2', label: 'How confident are you this counts as progress?', placeholder: 'Scale 1-10 or describe...' },
    { id: 'q3', label: 'Any obstacles you overcame?', placeholder: 'Optional: mention challenges...' },
    { id: 'q4', label: 'What\'s your next step?', placeholder: 'Describe your next goal...' },
  ]

  const handleAnswerChange = (qNum: number, value: string) => {
    setAnswers({
      ...answers,
      [`q${qNum}_answer`]: value,
    })
  }

  const handleReasonChange = (qNum: number, value: string) => {
    setReasons({
      ...reasons,
      [`q${qNum}_reason`]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!answers.q1_answer || !answers.q2_answer || !answers.q3_answer || !answers.q4_answer) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/verifications/${pactId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q1_answer: answers.q1_answer,
          q2_answer: answers.q2_answer,
          q3_answer: answers.q3_answer,
          q4_answer: answers.q4_answer,
          q1_reason: reasons.q1_reason || undefined,
          q2_reason: reasons.q2_reason || undefined,
          q3_reason: reasons.q3_reason || undefined,
          q4_reason: reasons.q4_reason || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit verification')
      }

      toast.success('Verification submitted successfully!')
      onSubmit?.()
      onClose()
      setAnswers({ q1_answer: '', q2_answer: '', q3_answer: '', q4_answer: '' })
      setReasons({ q1_reason: '', q2_reason: '', q3_reason: '', q4_reason: '' })
    } catch (error) {
      console.error('Verification error:', error)
      toast.error('Failed to submit verification')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full max-h-[90vh] rounded-t-3xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Submit Progress</h2>
            <p className="text-sm text-slate-600 font-medium mt-1">Share how you&apos;re progressing on this pact</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-slate-600" strokeWidth={2} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 pb-24">
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{idx + 1}</span>
                  </div>
                  <label className="block font-semibold text-slate-900">{q.label}</label>
                </div>
                <textarea
                  value={answers[`q${idx + 1}_answer` as keyof typeof answers]}
                  onChange={(e) => handleAnswerChange(idx + 1, e.target.value)}
                  placeholder={q.placeholder}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
                <textarea
                  value={reasons[`q${idx + 1}_reason` as keyof typeof reasons]}
                  onChange={(e) => handleReasonChange(idx + 1, e.target.value)}
                  placeholder="Optional reason or note..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </form>

        {/* Footer - Submit Button */}
        <div className="border-t border-slate-100 px-6 py-4 flex gap-3 flex-shrink-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Progress'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
