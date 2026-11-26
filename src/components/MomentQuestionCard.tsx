'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { socialService, type MomentQuestion } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';

const INK = '#17181D';
const NAVY = '#1F3A93';

/**
 * The question a poster asked under a moment ("Lake loop or the hill tomorrow?").
 * With two answers, people tap one; after that each answer shows its share,
 * like a poll. Tapping another answer changes it; tapping yours again takes it back.
 */
export default function MomentQuestionCard({
  pactId,
  question: initial,
  askerName,
  compact = false,
}: {
  pactId: number;
  question: MomentQuestion;
  askerName: string;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState<MomentQuestion>(initial);
  const [source, setSource] = useState<MomentQuestion>(initial);
  const [saving, setSaving] = useState(false);
  // Fresh numbers from the server (a refetched card) replace the local ones.
  if (source !== initial) {
    setSource(initial);
    setQuestion(initial);
  }

  const answered = question.my_answer != null;
  const total = Math.max(0, question.answer_count);

  const tap = async (index: number) => {
    if (saving) return;
    const previous = question;
    const taking = question.my_answer === index;
    // Show it straight away; the server's numbers replace these.
    setQuestion((q) => {
      const options = q.options.map((o) => ({
        ...o,
        count: Math.max(0, o.count + (o.index === index ? (taking ? -1 : 1) : o.index === q.my_answer ? -1 : 0)),
      }));
      return { ...q, options, my_answer: taking ? null : index, answer_count: options.reduce((n, o) => n + o.count, 0) };
    });
    setSaving(true);
    try {
      const next = taking
        ? await socialService.clearMomentAnswer(pactId, question.proof_id)
        : await socialService.answerMomentQuestion(pactId, question.proof_id, index);
      setQuestion(next);
      void queryClient.invalidateQueries({ queryKey: queryKeys.pacts.comments(pactId) });
    } catch {
      setQuestion(previous);
      toast.error("Couldn't save your answer. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rounded-[16px] ${compact ? 'px-3 py-2.5' : 'px-3.5 py-3'}`} style={{ background: '#E8ECF8' }} onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-1.5 text-[11.5px] font-extrabold uppercase tracking-[0.04em]" style={{ color: NAVY }}>
        <HelpCircle className="size-[13px]" strokeWidth={2.4} aria-hidden="true" />
        {askerName} asks
      </div>
      <p className="mt-1 text-[15px] font-bold leading-[1.3]" style={{ color: INK }}>{question.question}</p>
      {question.options.length === 2 && (
        <div className={`mt-2 ${answered ? 'flex flex-col gap-1.5' : 'flex gap-2'}`}>
          {question.options.map((option) => {
            const mine = question.my_answer === option.index;
            if (!answered) {
              return (
                <button
                  key={option.index}
                  type="button"
                  onClick={() => void tap(option.index)}
                  disabled={saving}
                  className="h-10 min-w-0 flex-1 truncate rounded-full px-3 text-[14px] font-extrabold transition active:scale-[0.97]"
                  style={{ border: `1.5px solid ${NAVY}`, background: '#FBFAF6', color: NAVY }}
                >
                  {option.label}
                </button>
              );
            }
            const share = total > 0 ? option.count / total : 0;
            return (
              <button
                key={option.index}
                type="button"
                onClick={() => void tap(option.index)}
                disabled={saving}
                aria-pressed={mine}
                aria-label={`${option.label}, ${option.count} ${option.count === 1 ? 'answer' : 'answers'}${mine ? ', your answer' : ''}`}
                className="relative flex h-10 items-center overflow-hidden rounded-full px-3.5 text-left text-[14px] font-extrabold"
                style={{ background: 'rgba(31,58,147,0.10)', color: INK, border: mine ? `1.5px solid ${NAVY}` : '1.5px solid transparent' }}
              >
                <span className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500" style={{ width: `${Math.round(share * 100)}%`, background: mine ? 'rgba(31,58,147,0.28)' : 'rgba(31,58,147,0.14)' }} aria-hidden="true" />
                <span className="relative min-w-0 flex-1 truncate">{option.label}</span>
                <span className="relative tabular-nums" style={{ color: NAVY }}>{option.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
