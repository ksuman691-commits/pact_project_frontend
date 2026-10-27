'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Minus, Plus, Trash2, Type } from 'lucide-react';
import { CAMERA_FILTERS } from '@/lib/cameraFilters';
import { TEXT_COLORS, TEXT_SIZES, filterCss, hasEdits, NO_EDITS, type ProofEdits, type TextLayer } from '@/lib/proofEdit';

/**
 * The picture with its edits on top: filter chips, and text you can drag.
 * What you see here is what gets baked into the file (lib/proofEdit.ts).
 */
export default function ProofEditor({
  url,
  isPhoto,
  edits,
  onChange,
  disabled,
  canEdit = true,
}: {
  url: string;
  isPhoto: boolean;
  edits: ProofEdits;
  onChange: (next: ProofEdits) => void;
  disabled?: boolean;
  /** False when this browser can't bake edits into video. */
  canEdit?: boolean;
}) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [maxH, setMaxH] = useState(440);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string } | null>(null);

  useEffect(() => {
    setMaxH(Math.round(window.innerHeight * 0.5));
  }, []);

  const aspect = natural ? natural.w / natural.h : 9 / 16;
  const width = Math.min(300, Math.round(maxH * aspect));
  const picked = edits.texts.find((t) => t.id === selected) ?? null;

  const setText = (id: string, patch: Partial<TextLayer>) =>
    onChange({ ...edits, texts: edits.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)) });

  const addText = () => {
    const text = (draft ?? '').trim();
    if (!text) {
      setDraft(null);
      return;
    }
    const layer: TextLayer = {
      id: `t${Date.now()}`,
      text: text.slice(0, 40),
      x: 0.5,
      y: 0.5 - Math.min(0.2, edits.texts.length * 0.1) + (edits.texts.length ? 0.2 : 0),
      color: TEXT_COLORS[0],
      size: TEXT_SIZES.start,
    };
    onChange({ ...edits, texts: [...edits.texts, layer] });
    setSelected(layer.id);
    setDraft(null);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.min(0.9, Math.max(0.1, (e.clientX - rect.left) / rect.width));
    const y = Math.min(0.92, Math.max(0.08, (e.clientY - rect.top) / rect.height));
    setText(drag.current.id, { x, y });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={stageRef}
        className="relative overflow-hidden rounded-[18px] bg-[var(--ink)] [container-type:inline-size]"
        style={{ width, aspectRatio: String(aspect) }}
        onPointerMove={onMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onClick={() => setSelected(null)}
      >
        {isPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Your proof"
            className="size-full object-fill"
            style={{ filter: filterCss(edits.filterId) }}
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          />
        ) : (
          <video
            src={url}
            autoPlay
            loop
            muted
            playsInline
            className="size-full object-fill"
            style={{ filter: filterCss(edits.filterId) }}
            onLoadedMetadata={(e) => setNatural({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight })}
          />
        )}
        {edits.texts.map((layer) => (
          <div
            key={layer.id}
            role="button"
            tabIndex={0}
            aria-label={`Text: ${layer.text}`}
            onPointerDown={(e) => {
              if (disabled) return;
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { id: layer.id };
              setSelected(layer.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none whitespace-nowrap font-extrabold leading-none ${selected === layer.id ? 'outline-dashed outline-1 outline-offset-4 outline-white' : ''}`}
            style={{
              left: `${layer.x * 100}%`,
              top: `${layer.y * 100}%`,
              fontSize: `${layer.size * 100}cqw`,
              color: layer.color,
              WebkitTextStroke: `${layer.size * 14}cqw ${layer.color === '#17181D' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.55)'}`,
              paintOrder: 'stroke fill',
            }}
          >
            {layer.text}
          </div>
        ))}
      </div>

      {!canEdit ? (
        <p className="text-center text-[13px] text-[var(--muted)]">Text and filters on video need Chrome on Android or desktop. This will send as shot.</p>
      ) : (
        <div className="flex w-full max-w-[340px] flex-col gap-3">
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="radiogroup" aria-label="Filter">
            {CAMERA_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={edits.filterId === f.id}
                disabled={disabled}
                onClick={() => onChange({ ...edits, filterId: f.id })}
                className={`h-9 shrink-0 rounded-full px-3.5 text-[13px] font-bold disabled:opacity-50 ${
                  edits.filterId === f.id ? 'bg-[var(--ink)] text-[var(--card)]' : 'border border-[var(--line)] text-[var(--ink-soft)]'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>

          {draft !== null ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addText();
              }}
            >
              <input
                autoFocus
                value={draft}
                maxLength={40}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type something"
                aria-label="Text to add"
                className="h-11 min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--card)] px-4 text-[15px] outline-none focus:border-[var(--navy)]"
              />
              <button type="submit" className="h-11 rounded-full bg-[var(--navy)] px-5 text-[14px] font-semibold text-white">
                Add
              </button>
            </form>
          ) : picked ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Text colour">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={picked.color === c}
                    aria-label={`Colour ${c}`}
                    onClick={() => setText(picked.id, { color: c })}
                    className="size-7 rounded-full"
                    style={{ background: c, outline: picked.color === c ? '2px solid var(--navy)' : '1px solid var(--line)', outlineOffset: 2 }}
                  />
                ))}
              </div>
              <div className="flex items-center">
                <button type="button" aria-label="Smaller text" onClick={() => setText(picked.id, { size: Math.max(TEXT_SIZES.min, picked.size - TEXT_SIZES.step) })} className="flex size-11 items-center justify-center">
                  <Minus className="size-4" aria-hidden="true" />
                </button>
                <button type="button" aria-label="Bigger text" onClick={() => setText(picked.id, { size: Math.min(TEXT_SIZES.max, picked.size + TEXT_SIZES.step) })} className="flex size-11 items-center justify-center">
                  <Plus className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Delete text"
                  onClick={() => {
                    onChange({ ...edits, texts: edits.texts.filter((t) => t.id !== picked.id) });
                    setSelected(null);
                  }}
                  className="flex size-11 items-center justify-center text-[#B3261E]"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={disabled}
                onClick={() => setDraft('')}
                className="flex h-11 items-center gap-2 rounded-full border-[1.5px] border-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--navy)] disabled:opacity-50"
              >
                <Type className="size-4" aria-hidden="true" />
                Add text
              </button>
              {hasEdits(edits) && (
                <button type="button" disabled={disabled} onClick={() => onChange(NO_EDITS)} className="h-11 px-3 text-[14px] font-semibold text-[var(--muted)] underline underline-offset-4 disabled:opacity-50">
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
