'use client';

import FeedPactCard from '@/components/FeedPactCard';

const mockPact: any = {
  id: 9001,
  title: 'Use Circle pact app for 30 days daily',
  description: 'Garbagr',
  creator_id: 42,
  creator_username: 'Mojo',
  creator_name: 'Mojo',
  status: 'active',
  start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
  participants: [
    { id: 1, username: 'Mojo', full_name: 'Mojo' },
    { id: 2, username: 'Mat', full_name: 'Mat' },
  ],
  proofClips: [
    {
      id: 1,
      url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-08-22%20at%205.55.07%E2%80%AFPM-wSMXnYYN1lsaGNzlQAdVThYrpHhO7R.png',
      proof_type: 'image',
      caption: 'Day 5 proof',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      uploader: 'Mojo',
      day: 5,
    },
    {
      id: 2,
      url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-08-22%20at%205.23.25%E2%80%AFPM-pvuERRAANVE1GBi3v4x1TzPaOL62nR.png',
      proof_type: 'image',
      caption: 'Day 4 proof',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      uploader: 'Mat',
      day: 4,
    },
    {
      id: 3,
      url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-08-22%20at%205.55.07%E2%80%AFPM-wSMXnYYN1lsaGNzlQAdVThYrpHhO7R.png',
      proof_type: 'image',
      caption: 'Day 3 proof',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      uploader: 'Mojo',
      day: 3,
    },
  ],
};

export default function DevPreviewFeedSwipe() {
  return (
    <div className="min-h-screen bg-[#F4F2FB] px-4 py-6">
      <div className="mx-auto max-w-md overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-lg">
        <FeedPactCard
          pact={mockPact}
          userVote={null}
          onVote={async () => {}}
          onProofUpload={async () => {}}
          dismissOnVote={false}
          enableGestures={false}
          showVoteActions={false}
          canUploadProof={false}
        />
      </div>
    </div>
  );
}
