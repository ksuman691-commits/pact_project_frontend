'use client';

import FeedPactCard from '@/components/FeedPactCard';

const mockPact = {
  id: 999001,
  title: 'Run 5k every morning',
  description: 'Daily 5k streak',
  creator_id: 42,
  creator_username: 'Mojo',
  creator_name: 'Mojo',
  status: 'active',
  is_public: true,
  visibility: 'public',
  is_joined_by_me: true,
  can_join: false,
  active_cheer_count: 12,
  proof_count: 3,
  comment_count: 2,
  end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
  proofClips: [
    {
      id: 1,
      url: '/dev-preview-red.png',
      proof_type: 'image',
      caption: 'Day 5 proof (RED)',
      uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
      uploader: 'mojo',
      day: 5,
    },
    {
      id: 2,
      url: '/dev-preview-green.png',
      proof_type: 'image',
      caption: 'Day 4 proof (GREEN)',
      uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
      uploader: 'mojo',
      day: 4,
    },
    {
      id: 3,
      url: '/dev-preview-blue.png',
      proof_type: 'image',
      caption: 'Day 3 proof (BLUE)',
      uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 49).toISOString(),
      uploader: 'mojo',
      day: 3,
    },
  ],
};

export default function DevPreviewFeedSwipe() {
  return (
    <div className="min-h-screen bg-[var(--pact-bg)] p-4">
      <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-[var(--pact-hairline)] bg-[var(--pact-surface-1)]">
        <FeedPactCard pact={mockPact} enableGestures={false} showVoteActions={false} canUploadProof={false} canReport={false} />
      </div>
    </div>
  );
}
