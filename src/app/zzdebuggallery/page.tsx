'use client';

import FeedPactCard from '@/components/FeedPactCard';

// TEMPORARY debug harness — reproduces the reported feed-gallery bug report
// (photos 2 and 3 not loading) using the exact same recent_proofs shape the
// backend actually returns ({ url, username, created_at } only — confirmed
// by reading app/api/pacts.py::_recent_proofs_for_pacts in the backend
// repo). Delete this route once the investigation is done.
const mockPact = {
  id: 999,
  creator: 'debuguser',
  creator_username: 'debuguser',
  title: 'Debug gallery pact',
  category: 'Coding',
  start_date: '2026-08-01',
  end_date: '2026-10-30',
  is_joined_by_me: true,
  proof_count: 3,
  active_cheer_count: 0,
  comment_count: 0,
  can_join: false,
  join_block_reason: 'already_joined',
  recent_proofs: [
    { url: 'https://picsum.photos/id/1015/800/1000', username: 'debuguser', created_at: '2026-08-25T10:00:00Z' },
    { url: 'https://picsum.photos/id/1016/800/1000', username: 'debuguser', created_at: '2026-08-24T10:00:00Z' },
    { url: 'https://picsum.photos/id/1018/800/1000', username: 'debuguser', created_at: '2026-08-23T10:00:00Z' },
  ],
};

export default function DebugGalleryPage() {
  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <FeedPactCard pact={mockPact} />
    </div>
  );
}
