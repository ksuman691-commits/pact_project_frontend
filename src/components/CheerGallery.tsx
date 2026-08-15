'use client';

import Image from 'next/image';
import { PartyPopper } from 'lucide-react';
import Avatar from '@/components/Avatar';

export interface CheerItem {
  id: number;
  photo_url: string | null;
  sender_username: string | null;
  sender_avatar_url: string | null;
  created_at: string | null;
}

interface CheerGalleryProps {
  cheers: CheerItem[];
}

/**
 * Distinct from the creator's proof gallery: gold/amber accent, "Cheer" tag,
 * and a horizontal strip layout so it reads as encouragement from the crowd
 * rather than the pact-holder's own progress evidence.
 */
export default function CheerGallery({ cheers }: CheerGalleryProps) {
  if (cheers.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <PartyPopper className="h-5 w-5" style={{ color: 'var(--pact-gold)' }} />
        <h2 className="font-bold text-[#14121F]">Cheers ({cheers.length})</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {cheers.map((cheer) => (
          <div
            key={cheer.id}
            className="relative w-32 flex-shrink-0 overflow-hidden rounded-[20px] border-2 shadow-sm"
            style={{ borderColor: 'var(--pact-gold)' }}
          >
            <div className="relative aspect-square w-full bg-[#FAF9FE]">
              {cheer.photo_url && (
                <Image
                  src={cheer.photo_url}
                  alt={`Cheer from ${cheer.sender_username || 'a member'}`}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              )}
              <span
                className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                style={{ background: 'var(--pact-gold)' }}
              >
                <PartyPopper className="h-2.5 w-2.5" />
                Cheer
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2 py-1.5">
              <Avatar name={cheer.sender_username} avatarUrl={cheer.sender_avatar_url} size={18} />
              <span className="truncate text-xs font-semibold text-[#14121F]">
                @{cheer.sender_username || 'member'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
